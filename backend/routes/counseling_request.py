import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from models import Student, CounselingRequest, Violation, UploadedFile,db

counseling_bp = Blueprint("counseling_bp", __name__, url_prefix="/counseling")


# =========================
# STUDENT SUBMIT REQUEST
# =========================
@counseling_bp.post("/request")
def counseling_request():

    data = request.form or {}

    student_number = data.get("student_number")
    file = request.files.get("file")

    if not student_number:
        return jsonify({"message": "Missing student_number"}), 400

    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404

    # prevent duplicate pending request
    pending = CounselingRequest.query.filter_by(
        student_number=student_number,
        status="Pending",
        is_deleted=False
    ).first()

    if pending:
        return jsonify({"message": "You already have a pending request"}), 400

    filename_stored = None
    filename_original = None

    if file:
        ext = os.path.splitext(file.filename)[1].lower()
        filename_stored = f"{uuid.uuid4().hex}{ext}"
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename_stored)
        file.save(upload_path)
        filename_original = file.filename

    req = CounselingRequest(
        student_number=student_number,
        filename_stored=filename_stored,
        filename_original=filename_original,
        preferred_date=data.get("preferred_date"),
        preferred_time=data.get("preferred_time"),
        status="Pending",
        is_notified=False,
        is_read=False,
        is_deleted=False
    )

    db.session.add(req)
    db.session.commit()

    return jsonify({
        "message": "Counseling request submitted successfully",
        "request_id": req.request_id
    }), 201


# =========================
# GET REQUEST BY ID
# =========================
@counseling_bp.get("/<int:request_id>")
def get_request(request_id):

    req = CounselingRequest.query.get(request_id)

    if not req or req.is_deleted:
        return jsonify({"message": "Request not found"}), 404

    # =========================
    # GET LATEST UPLOADED FILE (CLOUDINARY)
    # =========================
    file_record = UploadedFile.query.filter_by(
        file_type="counseling_approved"
    ).order_by(
        UploadedFile.id.desc()
    ).first()

    return jsonify({
        "request_id": req.request_id,
        "student_number": req.student_number,
        "status": req.status,

        "preferred_date": (
            req.preferred_date.isoformat()
            if req.preferred_date else None
        ),

        "preferred_time": (
            str(req.preferred_time)
            if req.preferred_time else None
        ),

        "admin_set_date": (
            req.admin_set_date.isoformat()
            if req.admin_set_date else None
        ),

        "admin_set_time": (
            str(req.admin_set_time)
            if req.admin_set_time else None
        ),

        "filename_original": req.filename_original,

        # =========================
        # CLOUDINARY FILE URL (ADDED)
        # =========================
        "file_url": (
            file_record.path
            if file_record else None
        ),

        "requested_at": (
            req.requested_at.isoformat()
            if req.requested_at else None
        ),

        "processed_at": (
            req.processed_at.isoformat()
            if req.processed_at else None
        ),

        "is_read": req.is_read
    })
# =========================
# STUDENT HISTORY + LATEST VIOLATION
# =========================
@counseling_bp.get("/history")
def history():

    student_number = request.args.get(
        "student_number"
    )

    if not student_number:
        return jsonify({
            "message": "missing student_number"
        }),400

    try:

        student = Student.query.filter_by(
            student_number=student_number
        ).first()

        requests = CounselingRequest.query.filter_by(
            student_number=student_number,
            is_deleted=False
        ).order_by(
            CounselingRequest.requested_at.desc()
        ).all()

        latest_violation = None

        if student:

            latest_violation = Violation.query.filter(

                Violation.student_id ==
                str(student.student_number),

                Violation.is_resolved !=
                "Resolved",

                Violation.is_deleted ==
                False

            ).order_by(

                Violation.violation_date.desc(),
                Violation.id.desc()

            ).first()

        result = []

        for r in requests:

            # =========================
            # GET ADMIN APPROVED FILE
            # =========================
            file_record = UploadedFile.query.filter_by(
                file_type="counseling_appointment"
            ).order_by(
                UploadedFile.id.desc()
            ).first()

            result.append({

                "request_id":
                    r.request_id,

                "status":
                    r.status,

                "preferred_date":
                    r.preferred_date.isoformat()
                    if r.preferred_date
                    else None,

                "preferred_time":
                    str(r.preferred_time)
                    if r.preferred_time
                    else None,

                "admin_set_date":
                    r.admin_set_date.isoformat()
                    if r.admin_set_date
                    else None,

                "admin_set_time":
                    str(r.admin_set_time)
                    if r.admin_set_time
                    else None,

                # STUDENT FILE
                "filename_stored":
                    r.filename_stored,

                "filename_original":
                    r.filename_original,

                # ADMIN APPROVED FILE
                "file_url":
                    file_record.path
                    if file_record
                    else None,

                "requested_at":
                    r.requested_at.isoformat()
                    if r.requested_at
                    else None,

                "processed_at":
                    r.processed_at.isoformat()
                    if r.processed_at
                    else None,

                "predicted_violation":
                    latest_violation.predicted_violation
                    if latest_violation
                    else "—",

                "predicted_section":
                    latest_violation.predicted_section
                    if latest_violation
                    else "—",

                "sanction":
                    latest_violation.sanction
                    if latest_violation
                    else "—",

                "violation_date":
                    (
                        latest_violation
                        .violation_date
                        .strftime("%Y-%m-%d")
                    )
                    if (
                        latest_violation
                        and
                        latest_violation.violation_date
                    )
                    else "—"

            })

        return jsonify(result)

    except Exception as e:

        print(
            "COUNSELING HISTORY ERROR:",
            str(e)
        )

        return jsonify({
            "message": "Server error",
            "error": str(e)
        }),500
# =========================
# ADMIN LIST REQUESTS
# =========================
@counseling_bp.get("/admin/requests")
def admin_requests():

    status = request.args.get("status", "Pending")

    requests = CounselingRequest.query.filter_by(
        status=status,
        is_deleted=False
    ).order_by(
        CounselingRequest.requested_at.desc()
    ).all()

    result = []

    for r in requests:

        # =========================
        # STUDENT INFO
        # =========================
        student = Student.query.filter_by(
            student_number=r.student_number
        ).first()

        # =========================
        # LATEST ACTIVE VIOLATION (FIXED)
        # =========================
        violation = None

        if student:

            violation = Violation.query.filter(
                Violation.student_id == str(student.student_number),
                Violation.is_deleted == False,
                Violation.is_resolved != "Resolved"
            ).order_by(
                Violation.violation_date.desc(),
                Violation.id.desc()
            ).first()

        # =========================
        # RESPONSE
        # =========================
        result.append({
            # REQUEST
            "request_id": r.request_id,
            "student_number": r.student_number,
            "student_name": student.student_name if student else "",
            "course": student.course if student else "",

            # SCHEDULE
            "preferred_date": (
                r.preferred_date.isoformat()
                if r.preferred_date else None
            ),
            "preferred_time": (
                r.preferred_time.strftime("%H:%M:%S")
                if r.preferred_time else None
            ),

            "admin_set_date": (
                r.admin_set_date.isoformat()
                if r.admin_set_date else None
            ),
            "admin_set_time": (
                r.admin_set_time.strftime("%H:%M:%S")
                if r.admin_set_time else None
            ),

            # STATUS
            "status": r.status,
            "requested_at": (
                r.requested_at.isoformat()
                if r.requested_at else None
            ),
            "processed_at": (
                r.processed_at.isoformat()
                if r.processed_at else None
            ),
            "filename_original": r.filename_original,

            # =========================
            # VIOLATION (FIXED LOGIC)
            # =========================
            "latest_violation": (
                violation.predicted_violation
                if violation else None
            ),

            "sanction": (
                violation.sanction
                if violation else None
            ),

            "violation_date": (
                violation.violation_date.isoformat()
                if violation and violation.violation_date else None
            )
        })

    return jsonify(result)

# =========================
# ADMIN PROCESS
# =========================
@counseling_bp.patch("/process/<int:request_id>")
def process_request(request_id):

    data = request.json or {}

    req = CounselingRequest.query.get(request_id)

    if not req or req.is_deleted:
        return jsonify({"message": "Request not found"}), 404

    status = data.get("status")
    admin_id = data.get("admin_id")

    if status not in ["Approved", "Rejected"]:
        return jsonify({"message": "Invalid status"}), 400

    # prevent re-processing
    if req.status != "Pending":
        return jsonify({"message": "Request already processed"}), 400

    req.status = status
    req.processed_by = admin_id
    req.processed_at = db.func.now()

    # reset notification flag so student gets update
    req.is_notified = False
    req.is_read = False

    if status == "Approved":
        if not data.get("admin_set_date") or not data.get("admin_set_time"):
            return jsonify({"message": "Missing schedule for approval"}), 400

        req.admin_set_date = data.get("admin_set_date")
        req.admin_set_time = data.get("admin_set_time")

    else:
        req.admin_set_date = None
        req.admin_set_time = None

    db.session.commit()

    return jsonify({
        "message": f"Request {status} successfully"
    })


# =========================
# NOTIFICATIONS
# =========================
@counseling_bp.get("/notifications")
def notifications():

    student_number = request.args.get("student_number")

    if not student_number:
        return jsonify({"message": "missing student_number"}), 400

    requests = CounselingRequest.query.filter_by(
        student_number=student_number,
        is_deleted=False
    ).order_by(CounselingRequest.requested_at.desc()).all()

    result = []

    for r in requests:

        if r.status == "Pending":
            message = "Your counseling request is pending."
        elif r.status == "Approved":
            message = "Your counseling request has been approved."
        elif r.status == "Rejected":
            message = "Your counseling request has been rejected."
        else:
            message = "Status updated."

        result.append({
            "request_id": r.request_id,
            "status": r.status,
            "message": message,
            "is_read": r.is_read
        })

    return jsonify(result)


# =========================
#  Student unread notification count (FOR BADGE)
# =========================
@counseling_bp.get("/notifications/unread-count")
def unread_count():

    student_number = request.args.get("student_number")

    count = CounselingRequest.query.filter_by(
        student_number=student_number,
        is_read=False,
        is_deleted=False
    ).count()

    return jsonify({"unread": count})

# =========================
# MARK AS READ
# =========================
@counseling_bp.patch("/notifications/read/<int:request_id>")
def mark_read(request_id):

    req = CounselingRequest.query.get(request_id)

    if not req:
        return jsonify({"message": "Not found"}), 404

    req.is_read = True
    db.session.commit()

    return jsonify({"message": "Marked as read"})


# =========================
# DELETE NOTIFICATION
# =========================
@counseling_bp.delete("/notifications/<int:request_id>")
def delete_notification(request_id):

    req = CounselingRequest.query.get(request_id)

    if not req:
        return jsonify({"message": "Not found"}), 404

    req.is_deleted = True
    db.session.commit()

    return jsonify({"message": "Deleted successfully"})

# =========================
# Update Request 
# =========================
@counseling_bp.patch("/request/update/<int:request_id>")
def update_request(request_id):

    data = request.json or {}

    req = CounselingRequest.query.get(request_id)

    if not req or req.is_deleted:
        return jsonify({"message": "Not found"}), 404

    if req.status != "Pending":
        return jsonify({"message": "Cannot update processed request"}), 400

    req.preferred_date = data.get("preferred_date", req.preferred_date)
    req.preferred_time = data.get("preferred_time", req.preferred_time)

    db.session.commit()

    return jsonify({"message": "Request updated"})
# =========================
# Cancel Request (HARD DELETE)
# =========================
@counseling_bp.route("/request/cancel/<int:request_id>", methods=["DELETE"])
def cancel_request(request_id):

    req = CounselingRequest.query.get(request_id)

    if not req:
        return jsonify({"message": "Not found"}), 404

    if req.status != "Pending":
        return jsonify({"message": "Cannot cancel processed request"}), 400

    db.session.delete(req)
    db.session.commit()

    return jsonify({"message": "Request permanently deleted"})
# =========================
# full details view 
# =========================
@counseling_bp.get("/admin/request/<int:request_id>")
def admin_request_detail(request_id):

    req = CounselingRequest.query.get(request_id)

    if not req:
        return jsonify({"message": "Not found"}), 404

    student = Student.query.filter_by(
        student_number=req.student_number
    ).first()

    return jsonify({
        "request_id": req.request_id,
        "student_name": student.student_name if student else "",
        "course": student.course if student else "",
        "preferred_date": req.preferred_date,
        "preferred_time": req.preferred_time,
        "admin_set_date": req.admin_set_date,
        "admin_set_time": req.admin_set_time,
        "status": req.status,
        "requested_at": req.requested_at,
        "processed_at": req.processed_at,
        "filename_original": req.filename_original
    })

