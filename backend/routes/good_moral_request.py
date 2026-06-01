import os
import uuid
import io
import requests 
from flask import Blueprint, request, jsonify, send_file, current_app
from models import Student, GoodMoralRequest, UploadedFile, Violation, db
from routes.violations import VIOLATION_RULES
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from pypdf import PdfReader, PdfWriter


good_moral_bp = Blueprint("good_moral_bp", __name__, url_prefix="/good-moral")


# ==============================
# GENERATE GOOD MORAL PDF
# ==============================
def generate_good_moral_pdf(template_path, student_name, student_number):

    overlay_buffer = io.BytesIO()
    c = canvas.Canvas(overlay_buffer, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 10)

    # ==============================
    # PARSE NAME
    # ==============================
    name_parts = student_name.replace(",", "").split()

    surname = ""
    first_middle = ""
    middle_initial = ""

    if len(name_parts) >= 3:
        surname = name_parts[-1].upper()
        first_middle_parts = name_parts[:-1]

        if len(first_middle_parts[-1]) == 2 and first_middle_parts[-1].endswith("."):
            middle_initial = first_middle_parts[-1].upper()
            first_middle = " ".join(first_middle_parts[:-1])
        else:
            first_middle = " ".join(first_middle_parts)

            words = first_middle.split()
            if len(words) >= 2:
                possible = words[-1]
                if len(possible) == 1:
                    middle_initial = possible.upper() + "."
                    first_middle = " ".join(words[:-1])

    elif len(name_parts) == 2:
        surname = name_parts[-1].upper()
        first_middle = name_parts[0]

    else:
        surname = student_name
        first_middle = ""

    # ==============================
    # POSITIONS
    # ==============================
    name_y = height - 152

    surname_x = 250
    firstmid_x = 385
    middle_x = 510

    def draw_block(offset_y=0, offset_x=0):
        y = name_y - offset_y

        c.drawString(surname_x + offset_x, y, surname)

        if first_middle:
            c.drawString(firstmid_x + offset_x, y, first_middle)

        if middle_initial:
            c.drawString(middle_x + offset_x, y, middle_initial)

        c.drawString(260 + offset_x, (height - 178) - offset_y, str(student_number))

    # first copy
    draw_block(0, 0)

    # second copy (duplicate print)
    draw_block(395, 0)

    c.save()
    overlay_buffer.seek(0)

    # ==============================
    # LOAD TEMPLATE (CLOUDINARY SAFE)
    # ==============================
    try:
        response = requests.get(template_path, timeout=10)
        response.raise_for_status()
    except Exception as e:
        raise Exception(f"Failed to fetch template from Cloudinary: {str(e)}")

    template_file = io.BytesIO(response.content)

    try:
        template_reader = PdfReader(template_file)
    except Exception as e:
        raise Exception(f"Invalid PDF template: {str(e)}")

    overlay_reader = PdfReader(overlay_buffer)

    if not template_reader.pages:
        raise Exception("Template PDF has no pages")

    # ==============================
    # MERGE PDF
    # ==============================
    writer = PdfWriter()
    page = template_reader.pages[0]
    page.merge_page(overlay_reader.pages[0])
    writer.add_page(page)

    output_buffer = io.BytesIO()
    writer.write(output_buffer)
    output_buffer.seek(0)

    return output_buffer
# =========================
# Sanction-based revoke checker
# =========================
def should_auto_revoke(student_number):

    violations = Violation.query.filter_by(
        student_id=student_number,
        is_resolved="Pending"
    ).all()

    if not violations:
        return False
    revoke_keywords = [
            "administrative review required",
            "1 month to 1 semester",
            "1 week to 1 semester exclusion",
            "1 month to 1 semester exclusion",
            "1 week to 1 semester exclusion",
            "possible university exclusion",
            "expulsion / permanent dismissal",
            "escalated disciplinary action"
        ]

    for v in violations:

        sanction = (getattr(v, "sanction", "") or "").lower()

        if any(k in sanction for k in revoke_keywords):
            return True

    return False

# =========================
# AUTO REVOKE (SANCTION BASED)
# =========================
def auto_revoke_if_violations(student_number):

    if not should_auto_revoke(student_number):
        return False

    requests = GoodMoralRequest.query.filter(
        GoodMoralRequest.student_number == student_number,
        GoodMoralRequest.status.in_(["Pending", "Approved"])
    ).all()

    for r in requests:

        if "Auto-revoked" not in (r.remarks or ""):

            r.status = "Rejected"
            r.remarks = (
                "Auto-revoked due to violation sanction level."
            )

            r.is_notified = False
            r.is_read = False

            db.session.add(r)

    db.session.commit()

    return True
# =========================
# Student submits a Good Moral request
# =========================
@good_moral_bp.post("/request")
def good_moral_request():
    data = request.form or {}
    student_number = data.get("student_number")
    file = request.files.get("certificate_file")

    if not student_number:
        return jsonify({"message": "Missing student_number"}), 400

    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404

    if should_auto_revoke(student_number):

        return jsonify({
            "message":
            "Cannot submit: violation sanction level blocks Good Moral request."
        }), 403

    pending_request = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        status="Pending"
    ).first()
    if pending_request:
        return jsonify({"message": "You already have a pending request"}), 400

    filename_stored = None
    filename_original = None
    if file:
        ext = os.path.splitext(file.filename)[1].lower()
        filename_stored = f"{uuid.uuid4().hex}{ext}"
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename_stored)
        file.save(upload_path)
        filename_original = file.filename

    gm_request = GoodMoralRequest(
        student_number=student_number,
        filename_stored=filename_stored,
        filename_original=filename_original,
        status="Pending",
        is_notified=False,
        is_read=False,
        is_deleted=False
    )
    db.session.add(gm_request)
    db.session.commit()

    return jsonify({
        "message": "Good Moral request submitted successfully",
        "request_id": gm_request.request_id
    })

# =========================
# Cancel request
# =========================
@good_moral_bp.delete("/request/<int:request_id>")
def cancel_request(request_id):
    gm_request = GoodMoralRequest.query.get(request_id)
    if not gm_request:
        return jsonify({"message": "Request not found"}), 404
    if gm_request.status != "Pending":
        return jsonify({"message": "Only pending requests can be cancelled"}), 400

    db.session.delete(gm_request)
    db.session.commit()
    return jsonify({"message": "Request cancelled successfully"})

# =========================
# Student Good Moral History
# =========================
@good_moral_bp.get("/history")
def student_history():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400
    auto_revoke_if_violations(student_number)

    requests = GoodMoralRequest.query.filter_by(student_number=student_number)\
        .order_by(GoodMoralRequest.requested_at.desc()).all()

    result = [dict(
        request_id=r.request_id,
        status=r.status,
        filename_original=r.filename_original,
        requested_at=r.requested_at,
        processed_at=r.processed_at,
        remarks=r.remarks,
        message=r.remarks if r.status=="Rejected" else "",
        is_read=r.is_read,
        is_deleted=r.is_deleted
    ) for r in requests]

    return jsonify({
        "auto_revoked":
            should_auto_revoke(student_number),

        "history": result
    })
# =========================
# Student Notifications
# =========================
@good_moral_bp.get("/notification")
def student_notification():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400

    notifications = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        is_deleted=False
    ).order_by(GoodMoralRequest.requested_at.desc()).all()

    notifications_result = [dict(
        request_id=r.request_id,
        status=r.status,
        filename_original=r.filename_original,
        requested_at=r.requested_at,
        processed_at=r.processed_at,
        remarks=r.remarks,
        is_read=r.is_read
    ) for r in notifications]

    return jsonify({
        "notifications": notifications_result
    })

# =========================
# Admin process request
# =========================
@good_moral_bp.patch("/process/<int:request_id>")
def process_request(request_id):
    data = request.json or {}
    status = data.get("status")
    admin_id = data.get("admin_id")
    remarks = data.get("remarks", "")

    if status not in ["Approved", "Rejected"]:
        return jsonify({"message": "Invalid status"}), 400

    gm_request = GoodMoralRequest.query.get(request_id)
    if not gm_request:
        return jsonify({"message": "Request not found"}), 404

    gm_request.status = status
    gm_request.processed_by = admin_id
    gm_request.processed_at = db.func.now()
    gm_request.remarks = remarks
    gm_request.is_notified = False
    gm_request.is_read = False
    db.session.commit()

    download_url = None
    if gm_request.status == "Approved" and gm_request.filename_stored:
        download_url = f"{request.host_url}good-moral/download/{gm_request.request_id}"

    return jsonify({
        "message": f"Request {status} successfully",
        "request": dict(
            request_id=gm_request.request_id,
            student_number=gm_request.student_number,
            status=gm_request.status,
            filename_original=gm_request.filename_original,
            filename_url=download_url,
            requested_at=gm_request.requested_at,
            processed_at=gm_request.processed_at,
            processed_by=gm_request.processed_by,
            remarks=gm_request.remarks,
            is_read=gm_request.is_read
        )
    })

# =========================
# Get request by ID
# =========================
@good_moral_bp.get("/<int:request_id>")
def get_request(request_id):
    gm_request = GoodMoralRequest.query.get(request_id)
    if not gm_request:
        return jsonify({"message": "Request not found"}), 404

    auto_revoke_if_violations(gm_request.student_number)

    return jsonify(dict(
        request_id=gm_request.request_id,
        student_number=gm_request.student_number,
        status=gm_request.status,
        filename_original=gm_request.filename_original,
        requested_at=gm_request.requested_at,
        processed_at=gm_request.processed_at,
        processed_by=gm_request.processed_by,
        remarks=gm_request.remarks,
        is_read=gm_request.is_read,
        is_deleted=gm_request.is_deleted
    ))

# =========================
# Admin list requests
# =========================
@good_moral_bp.get("/admin/requests")
def admin_list_requests():

    status_filter = request.args.get("status", "Pending")

    requests = GoodMoralRequest.query.filter_by(
        status=status_filter,
        is_deleted=False
    ).order_by(
        GoodMoralRequest.requested_at.desc()
    ).all()

    result = []

    for r in requests:

        student = Student.query.filter_by(
            student_number=r.student_number
        ).first()

        # ONLY ACTIVE / LATEST VIOLATION
        latest_violation = (
            Violation.query
            .filter(
                Violation.student_id == r.student_number,
                Violation.is_resolved != "Resolved"
            )
            .order_by(Violation.id.desc())
            .first()
        )

        result.append(dict(

            request_id=r.request_id,
            student_number=r.student_number,

            student_name=student.student_name if student else "",
            course=student.course if student else "",

            status=r.status,

            predicted_violation=
                latest_violation.violation_text
                if latest_violation else "",

            predicted_section=
                latest_violation.predicted_violation
                if latest_violation else "",

            sanction=
                latest_violation.sanction
                if latest_violation else "",

            is_resolved=
                latest_violation.is_resolved
                if latest_violation else "",

            filename_original=r.filename_original,
            requested_at=r.requested_at,
            processed_at=r.processed_at,
            remarks=r.remarks,
            is_read=r.is_read

        ))

    return jsonify(result)

# =========================
# Admin pending count
# =========================
@good_moral_bp.get("/admin/pending-count")
def admin_pending_count():
    count = GoodMoralRequest.query.filter_by(status="Pending", is_deleted=False).count()
    return jsonify({"pending_count": count})

# =========================
# Student notifications
# =========================
@good_moral_bp.get("/student/notifications")
def student_notifications():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400

    auto_revoke_if_violations(student_number)

    requests = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        is_notified=False,
        is_deleted=False
    ).order_by(GoodMoralRequest.requested_at.desc()).all()

    result = []
    result = []

    for r in requests:

        latest_violation = (
            Violation.query
            .filter(
                Violation.student_id == r.student_number,
                Violation.is_resolved != "Resolved"
            )
            .order_by(Violation.id.desc())
            .first()
        )

        sanction_text = (
            latest_violation.sanction
            if latest_violation and latest_violation.sanction
            else "Unknown sanction"
        )

        violation_name = (
            latest_violation.predicted_violation
            if latest_violation
            else "Violation"
        )

        if r.status == "Pending":

            message = "Your Good Moral request is pending."

        elif r.status == "Approved":

            message = "Your Good Moral request has been approved."

        elif r.status == "Rejected":

            if r.remarks and "auto-revoked" in (r.remarks or "").lower():

                message = (
                    f"Your Good Moral was auto-revoked due to "
                    f"{violation_name}. "
                    f"Applied sanction: {sanction_text}."
                )

            else:

                message = (
                    f"Your Good Moral request has been rejected. "
                    f"Violation: {violation_name}. "
                    f"Sanction: {sanction_text}."
                )

        else:

            message = "Status unknown."

        result.append(dict(
            request_id=r.request_id,
            status=r.status,
            message=message,
            remarks=r.remarks,
            requested_at=r.requested_at,
            is_read=r.is_read
        ))

    for r in requests:
        r.is_notified = True
    db.session.commit()

    return jsonify(result)

# =========================
# Student unread notification count (FOR BADGE)
# =========================
@good_moral_bp.get("/student/notifications/unread-count")
def unread_notification_count():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400

    count = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        is_read=False,
        is_deleted=False
    ).count()

    return jsonify({"unread_count": count})

# =========================
# X button / Mark notification as read
# =========================
@good_moral_bp.patch("/student/notifications/close/<int:request_id>")
def close_notification(request_id):
    r = GoodMoralRequest.query.get(request_id)
    if not r or r.is_deleted:
        return jsonify({"message": "Notification not found"}), 404

    r.is_read = True
    db.session.commit()
    return jsonify({"message": "Notification marked as read"})

# =========================
# Soft delete a notification
# =========================
@good_moral_bp.delete("/student/notifications/<int:request_id>")
def soft_delete_notification(request_id):
    r = GoodMoralRequest.query.get(request_id)
    if not r:
        return jsonify({"message": "Notification not found"}), 404

    r.is_deleted = True
    db.session.commit()
    return jsonify({"message": "Notification deleted successfully"})

# =========================
# Download Good Moral PDF (FIXED FOR CLOUDINARY)
# =========================
@good_moral_bp.get("/download/<int:request_id>")
def download_certificate(request_id):
    gm_request = GoodMoralRequest.query.get(request_id)
    if not gm_request:
        return jsonify({"message": "Request not found"}), 404

    # auto revoke check
    if auto_revoke_if_violations(gm_request.student_number):
        return jsonify({"message": "Your Good Moral has been revoked due to sanction severity."}), 403

    # must be approved
    if gm_request.status != "Approved":
        return jsonify({"message": "Request not approved"}), 403

    student = Student.query.filter_by(student_number=gm_request.student_number).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404

    # =========================
    #  GET TEMPLATE FROM CLOUDINARY (NOT LOCAL FILE)
    # =========================
    gm_template = UploadedFile.query.filter_by(
        file_type="good_moral"
    ).order_by(UploadedFile.uploaded_at.desc()).first()

    if not gm_template or not gm_template.path:
        return jsonify({"message": "No Good Moral template uploaded"}), 404

    # =========================
    # Cloudinary URL USED DIRECTLY
    # =========================
    template_path = gm_template.path

    pdf = generate_good_moral_pdf(
        template_path=template_path,
        student_name=student.student_name,
        student_number=student.student_number
    )

    return send_file(
        pdf,
        as_attachment=False,
        download_name="good_moral_certificate.pdf",
        mimetype="application/pdf"
    )

# =========================
# List approved Good Moral files (FIXED)
# =========================
@good_moral_bp.get("/student/files")
def student_files():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400

    files = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        status="Approved"
    ).order_by(GoodMoralRequest.processed_at.desc()).all()

    result = []
    for r in files:

        # =========================
        # download URL now ALWAYS points to backend route
        # backend will handle Cloudinary template internally
        # =========================
        download_url = f"{request.host_url}good-moral/download/{r.request_id}"

        result.append({
            "request_id": r.request_id,
            "filename_original": r.filename_original,
            "filename_stored": r.filename_stored,
            "processed_at": r.processed_at,
            "remarks": r.remarks,
            "download_url": download_url  # FIXED
        })

    return jsonify(result)