import os
import uuid
from flask import Blueprint, request, jsonify, send_file, current_app, make_response
from models import Admin, db
from helpers import verify_password

admin_bp = Blueprint("admin_bp", __name__, url_prefix="/admin")

# -------------------------
# Admin login
# -------------------------
@admin_bp.post("/login")
def admin_login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Missing email or password"}), 400

    admin = Admin.query.filter_by(email=email).first()
    if not admin or not verify_password(admin.password, password):
        return jsonify({"message": "Invalid admin credentials"}), 401

    profile_url = (
        f"{request.host_url}admin/uploads/{admin.profile_pic}?t={uuid.uuid4().hex}"
        if admin.profile_pic else f"{request.host_url}admin/uploads/default.png?t={uuid.uuid4().hex}"
    )

    return jsonify({
        "message": "Admin login successful",
        "admin": {
            "admin_id": admin.admin_id,    # ← FIXED
            "email": admin.email,
            "profile_pic": profile_url
        }
    })


# -------------------------
# Upload profile picture
# -------------------------
@admin_bp.post("/upload_profile")
def upload_profile_pic():
    admin_id = request.form.get("admin_id")
    file = request.files.get("profile_pic")

    if not admin_id or not file:
        return jsonify({"message": "Missing admin_id or profile_pic file"}), 400

    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"message": "Admin not found"}), 404

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif']:
        return jsonify({"message": "Invalid file type"}), 400

    filename = f"{uuid.uuid4().hex}{ext}"
    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(upload_path)

    admin.profile_pic = filename
    db.session.commit()

    profile_url = f"{request.host_url}admin/uploads/{filename}?t={uuid.uuid4().hex}"
    return jsonify({"message": "Profile picture updated", "profile_pic": profile_url})


# -------------------------
# Serve uploaded files
# -------------------------
@admin_bp.get("/uploads/<filename>")
def uploaded_file(filename):
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({"message": "File not found"}), 404

    resp = make_response(send_file(file_path))
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp


# -------------------------
# Get admin info
# -------------------------
@admin_bp.get("/me")
def get_admin_info():
    admin_id = request.args.get("admin_id")
    if not admin_id:
        return jsonify({"message": "admin_id missing"}), 400

    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"message": "Admin not found"}), 404

    profile_url = (
        f"{request.host_url}admin/uploads/{admin.profile_pic}?t={uuid.uuid4().hex}"
        if admin.profile_pic else f"{request.host_url}admin/uploads/default.png?t={uuid.uuid4().hex}"
    )

    return jsonify({
        "admin_id": admin.admin_id,      # ← FIXED
        "email": admin.email,
        "name": getattr(admin, 'name', 'Admin'),
        "profile_pic": profile_url
    })