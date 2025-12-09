from flask import Blueprint, request, jsonify, send_from_directory
from extension import db
from models import Student
import hashlib
from flask_cors import cross_origin
import traceback
import os
import uuid

# ===========================
# Blueprint
# ===========================
student_bp = Blueprint("students", __name__, url_prefix="/students")

# ===========================
# Config
# ===========================
UPLOAD_FOLDER = "static/uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ===========================
# Serve uploaded files
# ===========================
@student_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ===========================
# Helpers
# ===========================
def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()


def verify_password(stored, provided):
    return stored == hashlib.sha256(provided.encode()).hexdigest()


def profile_url(filename):
    if not filename:
        return None
    return f"http://localhost:5000/students/uploads/{filename}?t={uuid.uuid4().hex}"


# ===========================
# REGISTER STUDENT
# ===========================
@student_bp.route("/register", methods=["POST", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def register_student():
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200

    try:
        data = request.get_json() or {}

        student_number = data.get("student_number", "").strip()
        student_name = data.get("student_name", "").strip()
        email = data.get("email", "").strip()
        phone = data.get("phone", "")
        course = data.get("course", "")
        password = data.get("password")

        # VALIDATIONS
        if not all([student_number, student_name, email, password]):
            return jsonify({"message": "Missing required fields"}), 400

        if not student_number.isdigit():
            return jsonify({"message": "Student number must be numeric"}), 400

        if phone and not phone.isdigit():
            return jsonify({"message": "Phone must contain only digits"}), 400

        # CONFLICT CHECKS
        if Student.query.filter_by(student_number=student_number).first():
            return jsonify({"message": "Student number already exists"}), 409

        if Student.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 409

        # OPTIONAL PHONE UNIQUE CHECK (if your DB enforces it)
        existing_phone = Student.query.filter_by(phone=phone).first()
        if phone and existing_phone:
            return jsonify({"message": "Phone already used"}), 409

        new_student = Student(
            student_number=student_number,
            student_name=student_name,
            email=email,
            phone=phone,
            course=course,
            password=hash_password(password),
            profile_pic=None
        )

        db.session.add(new_student)
        db.session.commit()

        return jsonify({"message": "Registration successful"}), 201

    except Exception as e:
        db.session.rollback()
        print("REGISTER ERROR:", e)
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500


# ===========================
# LOGIN STUDENT
# ===========================
@student_bp.route("/login", methods=["POST", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def login_student():
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200

    try:
        data = request.get_json() or {}
        student_number = (data.get("student_number") or "").strip()
        password = data.get("password")

        if not student_number or not password:
            return jsonify({"message": "Missing credentials"}), 400

        if not student_number.isdigit():
            return jsonify({"message": "Student number must be numeric"}), 400

        student = Student.query.filter_by(student_number=student_number).first()

        if not student or not verify_password(student.password, password):
            return jsonify({"message": "Invalid credentials"}), 401

        return jsonify({
            "message": "Login successful",
            "student": {
                "id": student.id,
                "student_number": student.student_number,
                "student_name": student.student_name,
                "email": student.email,
                "phone": student.phone,
                "course": student.course,
                "profile_pic": profile_url(student.profile_pic)
            }
        }), 200

    except Exception:
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500


# ===========================
# GET STUDENT BY QUERY
# ===========================
@student_bp.route("/student", methods=["GET"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def get_student():
    try:
        query = request.args.get("query", "").strip()
        if not query:
            return jsonify({"student": None}), 200

        if query.isdigit():
            student = Student.query.filter_by(id=int(query)).first()
        else:
            student = Student.query.filter(Student.student_name.ilike(f"%{query}%")).first()

        if not student:
            return jsonify({"student": None}), 200

        return jsonify({
            "student": {
                "student_id": student.id,
                "student_name": student.student_name,
                "course": student.course,
                "profile_pic": profile_url(student.profile_pic)
            }
        }), 200

    except Exception:
        traceback.print_exc()
        return jsonify({"student": None}), 200


# ===========================
# GET ALL STUDENTS
# ===========================
@student_bp.route("/all", methods=["GET"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def get_all_students():
    try:
        students = Student.query.all()
        result = [{
            "id": s.id,
            "student_name": s.student_name,
            "student_number": s.student_number,
            "email": s.email,
            "phone": s.phone,
            "course": s.course,
            "profile_pic": profile_url(s.profile_pic)
        } for s in students]

        return jsonify(result), 200
    except Exception:
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500


# ===========================
# DELETE STUDENT
# ===========================
@student_bp.route("/<int:id>", methods=["DELETE", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def delete_student(id):
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200

    student = Student.query.get(id)
    if not student:
        return jsonify({"message": "Student not found"}), 404

    try:
        db.session.delete(student)
        db.session.commit()
        return jsonify({"message": "Student deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500


# ===========================
# GET STUDENT BY STUDENT NUMBER
# ===========================
@student_bp.route("/by-number/<student_number>", methods=["GET"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def get_student_by_number(student_number):
    try:
        student = Student.query.filter_by(student_number=student_number).first()

        if not student:
            return jsonify({
                "student_name": None,
                "course": None,
                "profile_pic": None
            }), 200

        return jsonify({
            "student_name": student.student_name,
            "course": student.course,
            "profile_pic": profile_url(student.profile_pic)
        }), 200

    except Exception:
        traceback.print_exc()
        return jsonify({
            "student_name": None,
            "course": None,
            "profile_pic": None
        }), 200


# ===========================
# UPDATE PROFILE PICTURE
# ===========================
@student_bp.route("/<student_number>/profile-pic", methods=["POST"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def update_profile_pic(student_number):
    try:
        student = Student.query.filter_by(student_number=student_number).first()
        if not student:
            return jsonify({"message": "Student not found"}), 404

        if "profile_pic" not in request.files:
            return jsonify({"message": "No file provided"}), 400

        file = request.files["profile_pic"]

        if not file.filename:
            return jsonify({"message": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"message": "Invalid file type"}), 400

        # Delete old file
        if student.profile_pic:
            old_file = os.path.join(UPLOAD_FOLDER, student.profile_pic)
            if os.path.exists(old_file):
                os.remove(old_file)

        # Save new
        ext = os.path.splitext(file.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        file.save(os.path.join(UPLOAD_FOLDER, filename))

        student.profile_pic = filename
        db.session.commit()

        return jsonify({
            "message": "Profile picture updated successfully",
            "profile_pic": profile_url(filename)
        }), 200

    except Exception:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500
