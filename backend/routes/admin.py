import uuid
from flask import Blueprint, request, jsonify
from models import Admin, db
from helpers import verify_password
import cloudinary.uploader

admin_bp = Blueprint("admin_bp", __name__, url_prefix="/admin")

# SIMPLE IN-MEMORY TOKEN STORE (demo only)
active_tokens = {}

# -------------------------
# ADMIN LOGIN
# -------------------------
@admin_bp.post("/login")
def admin_login():
    data = request.json or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Missing email or password"
        }), 400

    admin = Admin.query.filter_by(email=email).first()

    if not admin or not verify_password(admin.password, password):
        return jsonify({
            "message": "Invalid admin credentials"
        }), 401

    # CREATE TOKEN
    token = str(uuid.uuid4())

    # STORE TOKEN SESSION
    active_tokens[token] = admin.admin_id

    return jsonify({
        "success": True,
        "message": "Admin login successful",
        "token": token,
        "admin": {
            "admin_id": admin.admin_id,
            "email": admin.email,
            "name": getattr(admin, "name", "Admin"),
            "profile_pic": admin.profile_pic
        }
    }), 200


# -------------------------
# GET ADMIN PROFILE (PROTECTED)
# -------------------------
@admin_bp.get("/me")
def get_admin_profile():

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"message": "Missing token"}), 401

    token = auth_header.replace("Bearer ", "")

    admin_id = active_tokens.get(token)

    if not admin_id:
        return jsonify({"message": "Invalid or expired token"}), 401

    admin = Admin.query.get(admin_id)

    if not admin:
        return jsonify({"message": "Admin not found"}), 404

    return jsonify({
        "admin": {
            "admin_id": admin.admin_id,
            "email": admin.email,
            "name": getattr(admin, "name", "Admin"),
            "profile_pic": admin.profile_pic
        }
    }), 200


# -------------------------
# UPLOAD PROFILE PICTURE (PROTECTED)
# -------------------------
@admin_bp.post("/upload_profile")
def upload_profile_pic():

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"message": "Missing token"}), 401

    token = auth_header.replace("Bearer ", "")

    admin_id = active_tokens.get(token)

    if not admin_id:
        return jsonify({"message": "Invalid token"}), 401

    file = request.files.get("profile_pic")

    if not file:
        return jsonify({"message": "Missing profile_pic"}), 400

    admin = Admin.query.get(admin_id)

    if not admin:
        return jsonify({"message": "Admin not found"}), 404

    ext = file.filename.rsplit(".", 1)[-1].lower()

    if ext not in ["jpg", "jpeg", "png", "gif"]:
        return jsonify({"message": "Invalid file type"}), 400

    try:
        result = cloudinary.uploader.upload(
            file,
            folder="admin_profiles"
        )

        admin.profile_pic = result["secure_url"]
        db.session.commit()

        return jsonify({
            "message": "Profile picture updated",
            "profile_pic": result["secure_url"],
            "public_id": result["public_id"]
        }), 200

    except Exception as e:
        return jsonify({
            "message": "Upload failed",
            "error": str(e)
        }), 500

# -------------------------
# ADMIN LOGOUT
# -------------------------
@admin_bp.post("/logout")
def logout_admin():

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"message": "Missing token"}), 401

    token = auth_header.replace("Bearer ", "")

    if token in active_tokens:
        del active_tokens[token]

    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    }), 200