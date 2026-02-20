import os
import uuid
from flask import Blueprint, request, jsonify, send_file, current_app, make_response
from models import Admin, Student, GoodMoralRequest, db

good_moral_bp = Blueprint("good_moral_bp", __name__, url_prefix="/good-moral")

# -------------------------
# Student submits a Good Moral request
# -------------------------
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
        status="Pending"
    )
    db.session.add(gm_request)
    db.session.commit()

    return jsonify({
        "message": "Good Moral request submitted successfully",
        "request_id": gm_request.request_id
    })

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


# -------------------------
# Student views all their requests
# -------------------------
@good_moral_bp.get("/history")
def student_history():
    student_number = request.args.get("student_number")
    if not student_number:
        return jsonify({"message": "student_number missing"}), 400

    requests = GoodMoralRequest.query.filter_by(student_number=student_number).order_by(GoodMoralRequest.requested_at.desc()).all()
    result = [{
        "request_id": r.request_id,
        "status": r.status,
        "filename_original": r.filename_original,
        "requested_at": r.requested_at,
        "processed_at": r.processed_at,
        "remarks": r.remarks
    } for r in requests]

    return jsonify(result)


# -------------------------
# Download approved Good Moral certificate
# -------------------------
@good_moral_bp.get("/download/<int:request_id>")
def download_certificate(request_id):
    gm_request = GoodMoralRequest.query.get(request_id)
    if not gm_request:
        return jsonify({"message": "Request not found"}), 404
    if gm_request.status != "Approved":
        return jsonify({"message": "Request not approved yet"}), 403

    # Check if there is a file
    if not gm_request.filename_stored:
        return jsonify({
            "message": "No file uploaded for this request",
            "request_id": gm_request.request_id,
            "student_number": gm_request.student_number,
            "filename_original": gm_request.filename_original,
            "status": gm_request.status
        })

    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], gm_request.filename_stored)
    if not os.path.exists(file_path):
        return jsonify({"message": "File not found"}), 404

    resp = make_response(send_file(file_path))
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp
# -------------------------
# Admin approves/rejects a request
# -------------------------
@good_moral_bp.patch("/process/<int:request_id>")
def process_request(request_id):
    data = request.json or {}
    status = data.get("status")  # "Approved" or "Rejected"
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
    db.session.commit()

    # Build download URL only if approved
    download_url = None
    if gm_request.status == "Approved" and gm_request.filename_stored:
        download_url = f"{request.host_url}good-moral/download/{gm_request.request_id}"

    # Return updated request object
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

# -------------------------
# Get request by ID
# -------------------------
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

# -------------------------
# Admin: list requests (with student info)
# -------------------------
@good_moral_bp.get("/admin/requests")
def admin_list_requests():
    status_filter = request.args.get("status", "Pending")  # default: Pending requests

    # Fetch all requests filtered by status
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

@good_moral_bp.get("/admin/pending-count")
def admin_pending_count():
    count = GoodMoralRequest.query.filter_by(status="Pending").count()
    return jsonify({"pending_count": count})