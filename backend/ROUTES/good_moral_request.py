import os
import uuid
import io
from flask import Blueprint, request, jsonify, send_file, current_app, send_from_directory
from models import Student, GoodMoralRequest, UploadedFile, db
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

good_moral_bp = Blueprint("good_moral_bp", __name__, url_prefix="/good-moral")

# =========================
# PDF Generation Function (auto-fill only)
# =========================
def generate_good_moral_pdf(template_path, student_name, student_number):
    """
    Uses the uploaded Good Moral template and fills in the student's
    name and number on the PDF. Does NOT create a new blank template.
    """
    overlay_buffer = io.BytesIO()
    c = canvas.Canvas(overlay_buffer, pagesize=A4)
    width, height = A4  # 595 x 842

    # Adjust positions as needed
    c.setFont("Helvetica-Bold", 12)
    c.drawString(228, height - 222, str(student_name))
    c.drawString(146, height - 245, str(student_number))
    c.save()
    overlay_buffer.seek(0)

    template_reader = PdfReader(template_path)
    overlay_reader = PdfReader(overlay_buffer)

    writer = PdfWriter()
    page = template_reader.pages[0]
    page.merge_page(overlay_reader.pages[0])
    writer.add_page(page)

    output_buffer = io.BytesIO()
    writer.write(output_buffer)
    output_buffer.seek(0)
    return output_buffer

# =========================
# Student submits a Good Moral request
# =========================
@good_moral_bp.post("/request")
def good_moral_request():
    data = request.form or {}
    student_number = data.get("student_number")
    file = request.files.get("certificate_file")  # Optional

    if not student_number:
        return jsonify({"message": "Missing student_number"}), 400

    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404

    filename_stored = None
    filename_original = None

    # Only save file if uploaded
    if file:
        ext = os.path.splitext(file.filename)[1].lower()
        filename_stored = f"{uuid.uuid4().hex}{ext}"
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename_stored)
        file.save(upload_path)
        filename_original = file.filename

    # Create Good Moral request in DB
    gm_request = GoodMoralRequest(
        student_number=student_number,
        filename_stored=filename_stored, 
        filename_original=filename_original,
        status="Pending",
        is_notified=False
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
# Student views all their requests
# =========================
@good_moral_bp.get("/history")
def student_history():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400

    requests = GoodMoralRequest.query.filter_by(student_number=student_number)\
        .order_by(GoodMoralRequest.requested_at.desc()).all()

    result = [{
        "request_id": r.request_id,
        "status": r.status,
        "filename_original": r.filename_original,
        "requested_at": r.requested_at,
        "processed_at": r.processed_at,
        "remarks": r.remarks
    } for r in requests]

    return jsonify(result)

# =========================
# Admin approves/rejects a request
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
    db.session.commit()

    download_url = None
    if gm_request.status == "Approved" and gm_request.filename_stored:
        download_url = f"{request.host_url}good-moral/download/{gm_request.request_id}"

    return jsonify({
        "message": f"Request {status} successfully",
        "request": {
            "request_id": gm_request.request_id,
            "student_number": gm_request.student_number,
            "status": gm_request.status,
            "filename_original": gm_request.filename_original,
            "filename_url": download_url,
            "requested_at": gm_request.requested_at,
            "processed_at": gm_request.processed_at,
            "processed_by": gm_request.processed_by,
            "remarks": gm_request.remarks
        }
    })

# =========================
# Get request by ID
# =========================
@good_moral_bp.get("/<int:request_id>")
def get_request(request_id):
    gm_request = GoodMoralRequest.query.get(request_id)
    if not gm_request:
        return jsonify({"message": "Request not found"}), 404

    return jsonify({
        "request_id": gm_request.request_id,
        "student_number": gm_request.student_number,
        "status": gm_request.status,
        "filename_original": gm_request.filename_original,
        "requested_at": gm_request.requested_at,
        "processed_at": gm_request.processed_at,
        "processed_by": gm_request.processed_by,
        "remarks": gm_request.remarks
    })

# =========================
# Admin: list requests
# =========================
@good_moral_bp.get("/admin/requests")
def admin_list_requests():
    status_filter = request.args.get("status", "Pending")
    requests = GoodMoralRequest.query.filter_by(status=status_filter)\
        .order_by(GoodMoralRequest.requested_at.desc()).all()

    result = []
    for r in requests:
        student = Student.query.filter_by(student_number=r.student_number).first()
        result.append({
            "request_id": r.request_id,
            "student_number": r.student_number,
            "student_name": student.student_name if student else "",
            "course": student.course if student else "",
            "status": r.status,
            "filename_original": r.filename_original,
            "requested_at": r.requested_at,
            "processed_at": r.processed_at,
            "remarks": r.remarks
        })

    return jsonify(result)

# =========================
# Admin pending count
# =========================
@good_moral_bp.get("/admin/pending-count")
def admin_pending_count():
    count = GoodMoralRequest.query.filter_by(status="Pending").count()
    return jsonify({"pending_count": count})

# =========================
# Student notifications
# =========================
@good_moral_bp.get("/student/notifications")
def student_notifications():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400

    requests = GoodMoralRequest.query.filter_by(
        student_number=student_number,
        is_notified=False
    ).all()

    result = []
    for r in requests:
        if r.status == "Pending":
            message = "Your Good Moral request is pending."
        elif r.status == "Approved":
            message = "Your Good Moral request has been approved."
        elif r.status == "Rejected":
            message = "Your Good Moral request has been rejected."
        else:
            message = "Status unknown."

        result.append({
            "request_id": r.request_id,
            "status": r.status,
            "message": message,
            "requested_at": r.requested_at
        })
        r.is_notified = True
        db.session.add(r)

    db.session.commit()
    return jsonify(result)

# =========================
# Download Good Moral PDF
# =========================
@good_moral_bp.get("/download/<int:request_id>")
def download_certificate(request_id):
  
    gm_request = GoodMoralRequest.query.get(request_id)
    if not gm_request:
        return jsonify({"message": "Request not found"}), 404

    if gm_request.status != "Approved":
        return jsonify({"message": "Request not approved"}), 403

    student = Student.query.filter_by(student_number=gm_request.student_number).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404

  
    gm_template = UploadedFile.query.filter_by(
        file_type="good_moral"
    ).order_by(UploadedFile.uploaded_at.desc()).first()

    if not gm_template or not os.path.exists(gm_template.path):
        return jsonify({"message": "No Good Moral template uploaded"}), 404


    pdf = generate_good_moral_pdf(
        template_path=gm_template.path,
        student_name=student.student_name,
        student_number=student.student_number
    )

    return send_file(
        pdf,
        as_attachment=False,
        download_name="good_moral_certificate.pdf",
        mimetype="application/pdf"
    )