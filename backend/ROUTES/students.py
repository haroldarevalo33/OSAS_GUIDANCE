from flask import Blueprint, request, jsonify, send_from_directory
from extension import db
from models import Student
import hashlib
from flask_cors import cross_origin
import traceback
from werkzeug.utils import secure_filename
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
# Serve Uploaded Files
# ===========================
@student_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ===========================
# Helper Functions
# ===========================
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest() if password else None

def verify_password(stored_password, provided_password):
    return stored_password == hashlib.sha256(provided_password.encode()).hexdigest()

def profile_url(filename):
    if filename:
        # Cache-busting with uuid query param
        return f"http://localhost:5000/students/uploads/{filename}?t={uuid.uuid4().hex}"
    return None

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
        student_number = (data.get("student_number") or "").strip()
        student_name = (data.get("student_name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip() if data.get("phone") else None
        course = (data.get("course") or "").strip() if data.get("course") else None
        profile_pic = data.get("profile_pic") or None
        password = data.get("password")

        if not all([student_number, student_name, email, password]):
            return jsonify({"message": "Missing required fields"}), 400
        if not student_number.isdigit():
            return jsonify({"message": "Student number must be numeric"}), 400
        if phone and not phone.isdigit():
            return jsonify({"message": "Phone number must contain only digits"}), 400
        if Student.query.filter_by(student_number=student_number).first():
            return jsonify({"message": "Student number already exists"}), 409
        if Student.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 409

        new_student = Student(
            student_number=student_number,
            student_name=student_name,
            email=email,
            phone=phone,
            course=course,
            profile_pic=profile_pic,
            password=hash_password(password)
        )
        db.session.add(new_student)
        db.session.commit()

        return jsonify({"message": "Registration successful"}), 201

    except Exception:
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

        return jsonify({
            "student": {
                "student_id": student.id,
                "student_name": student.student_name,
                "course": student.course,
                "profile_pic": profile_url(student.profile_pic)
            } if student else None
        }), 200

    except Exception:
        traceback.print_exc()
        return jsonify({"student": None}), 200

# ===========================
# FETCH ALL STUDENTS
# ===========================
@student_bp.route("/all", methods=["GET"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def get_all_students():
    try:
        students = Student.query.all()
        result = []
        for s in students:
            result.append({
                "id": s.id,
                "student_name": s.student_name,
                "student_number": s.student_number,
                "email": s.email,
                "phone": s.phone,
                "course": s.course,
                "profile_pic": profile_url(s.profile_pic)
            })
        return jsonify(result), 200
    except Exception:
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500

# ===========================
# DELETE STUDENT BY ID
# ===========================
@student_bp.route("/<int:id>", methods=["DELETE", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def delete_student(id):
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200
    student = Student.query.get(id)
    if not student:
        return {"message": "Student not found"}, 404
    try:
        db.session.delete(student)
        db.session.commit()
        return {"message": "Student deleted successfully"}
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

# ===========================
# GET STUDENT BY STUDENT NUMBER
# ===========================
@student_bp.route("/by-number/<student_number>", methods=["GET"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def get_student_by_number(student_number):
    try:
        student = Student.query.filter_by(student_number=student_number).first()
        if not student:
            return jsonify({"student_name": None, "course": None, "profile_pic": None}), 200
        return jsonify({
            "student_name": student.student_name,
            "course": student.course,
            "profile_pic": profile_url(student.profile_pic)
        }), 200
    except Exception as e:
        print("Error:", e)
        return jsonify({"student_name": None, "course": None, "profile_pic": None}), 200

# ===========================
# UPDATE PROFILE PICTURE (FILE UPLOAD)
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
        if file.filename == "":
            return jsonify({"message": "No selected file"}), 400

        if not allowed_file(file.filename):
            return jsonify({"message": "Invalid file type"}), 400

        # Delete old file safely
        if student.profile_pic:
            old_path = os.path.join(UPLOAD_FOLDER, student.profile_pic)
            if os.path.exists(old_path):
                os.remove(old_path)

        # Save new file with unique filename
        ext = os.path.splitext(file.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Update DB
        student.profile_pic = filename
        db.session.commit()

        return jsonify({
            "message": "Profile picture updated successfully",
            "profile_pic": profile_url(filename)
        }), 200

    except Exception:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": "Internal Server Error"}), 500
