import uuid
from flask import Blueprint, request, jsonify
from models import Admin, db
from helpers import verify_password
import cloudinary.uploader

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

    return jsonify({
        "message": "Admin login successful",
        "admin": {
            "admin_id": admin.admin_id,
            "email": admin.email,
            "name": getattr(admin, "name", "Admin"),
            "profile_pic": admin.profile_pic
        }
    }), 200


# -------------------------
# Upload profile picture
# -------------------------
@admin_bp.post("/upload_profile")
def upload_profile_pic():
    admin_id = request.form.get("admin_id")
    file = request.files.get("profile_pic")

    if not admin_id or not file:
        return jsonify({"message": "Missing admin_id or profile_pic"}), 400

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

    return jsonify({
        "admin_id": admin.admin_id,
        "email": admin.email,
        "name": getattr(admin, "name", "Admin"),
        "profile_pic": admin.profile_pic
    }), 200