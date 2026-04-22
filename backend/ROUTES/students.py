from flask import Blueprint, request, jsonify, send_from_directory
import re
from extension import db
from models import Student
import hashlib
from flask_cors import cross_origin
import traceback
import os
import uuid
from sqlalchemy import func, and_


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
# Serve uploaded files
# ===========================
@student_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


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

        if not all([student_number, student_name, email, password]):
            return jsonify({"message": "Missing required fields"}), 400

        if not student_number.isdigit():
            return jsonify({"message": "Student number must be numeric"}), 400

        if phone and not phone.isdigit():
            return jsonify({"message": "Phone must contain only digits"}), 400

        if Student.query.filter_by(student_number=student_number).first():
            return jsonify({"message": "Student number already exists"}), 409

        if Student.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 409

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
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500


# ===========================
# LOGIN
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
# GET STUDENT BY ID OR NAME
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
# GET STUDENT BY NUMBER
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
# UPDATE PROFILE PIC
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

        if student.profile_pic:
            old_file = os.path.join(UPLOAD_FOLDER, student.profile_pic)
            if os.path.exists(old_file):
                os.remove(old_file)

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
    
# ===========================
# UPDATE STUDENT INFO (MANAGE ACCOUNT)
# ===========================
@student_bp.route("/update", methods=["PUT", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def update_student():
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200

    try:
        data = request.get_json() or {}

        student_number_raw = data.get("student_number")
        if not student_number_raw:
            return jsonify({"message": "Student number is required"}), 400

        try:
            student_number = int(student_number_raw)
        except:
            return jsonify({"message": "Invalid student number"}), 400

        # ================= FIELDS =================
        student_name = (data.get("student_name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        course = (data.get("course") or "").strip()
        new_password = (data.get("password") or "").strip()

        student = Student.query.filter_by(student_number=student_number).first()

        if not student:
            return jsonify({"message": "Student not found"}), 404

        # ================= VALIDATION =================
        if phone and not phone.isdigit():
            return jsonify({"message": "Phone must be numeric"}), 400

        if email:
            existing_email = Student.query.filter(
                Student.email == email,
                Student.id != student.id
            ).first()

            if existing_email:
                return jsonify({"message": "Email already used"}), 409

        # ================= UPDATE FIELDS =================
        if student_name:
            student.student_name = student_name
        if email:
            student.email = email
        if phone:
            student.phone = phone
        if course:
            student.course = course

        # ================= PASSWORD UPDATE =================
        if new_password:
            if len(new_password) < 6:
                return jsonify({"message": "Password must be at least 6 characters"}), 400

            new_password_hash = hashlib.sha256(new_password.encode()).hexdigest()

            # PREVENT SAME PASSWORD
            if new_password_hash == student.password:
                return jsonify({
                    "message": "New password must be different from current password"
                }), 400

            student.password = new_password_hash

        db.session.commit()

        return jsonify({
            "message": "Account updated successfully",
            "student": {
                "student_number": student.student_number,
                "student_name": student.student_name,
                "email": student.email,
                "phone": student.phone,
                "course": student.course,
                "profile_pic": profile_url(student.profile_pic)
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({
            "message": "Internal Server Error",
            "error": str(e)
        }), 500
# ===========================
# GET FULL STUDENT DETAILS
# ===========================
@student_bp.route("/full/<student_number>", methods=["GET"])
def get_full_student(student_number):
    try:
        student = Student.query.filter_by(student_number=student_number).first()

        if not student:
            return jsonify({"message": "Student not found"}), 404

        return jsonify({
            "student_number": student.student_number,
            "student_name": student.student_name,
            "email": student.email,
            "phone": student.phone,
            "course": student.course,
            "password_hash": student.password,
            "profile_pic": profile_url(student.profile_pic)
        }), 200

    except Exception:
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500
    
# ===========================
# FORGOT / RESET PASSWORD (SHA256 VERSION FIXED)
# ===========================
@student_bp.route("/forgot-password", methods=["PUT", "OPTIONS"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def forgot_password():
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200

    try:
        data = request.get_json() or {}

        student_number = (data.get("student_number") or "").strip()
        new_password = (data.get("new_password") or "").strip()

        if not student_number or not new_password:
            return jsonify({"message": "Missing fields"}), 400

        if not student_number.isdigit():
            return jsonify({"message": "Invalid student number"}), 400

        student = Student.query.filter_by(student_number=student_number).first()

        if not student:
            return jsonify({"message": "Student not found"}), 404

       # must be at least 1 special char
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
            return jsonify({
                "message": "Password must contain at least 1 special character"
            }), 400

        # optional: no spaces
        if " " in new_password:
            return jsonify({
                "message": "Password must not contain spaces"
            }), 400

        if len(new_password) < 6:
            return jsonify({
                "message": "Password must be at least 6 characters"
            }), 400

        new_password_hash = hash_password(new_password)

        # CHECK OLD PASSWORD (IMPORTANT FIX)
        if new_password_hash == student.password:
            return jsonify({
                "message": "New password must be different from old password"
            }), 400

        student.password = new_password_hash
        db.session.commit()

        return jsonify({
            "message": "Password reset successful"
        }), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({
            "message": "Internal Server Error",
            "error": str(e)
        }), 500

# ===========================
# FILTERED STUDENT RECORDS
# ===========================
@student_bp.route("/records", methods=["GET"])
@cross_origin(origin="http://localhost:5173", supports_credentials=True)
def get_filtered_records():
    try:
        search = request.args.get("search", "").lower()
        course = request.args.get("course", "ALL")
        start_date = request.args.get("startDate")
        end_date = request.args.get("endDate")
        sort = request.args.get("sort", "DESC")

        query = Student.query

        concat_field = func.lower(
            func.concat(
                Student.student_name, " ",
                Student.email, " ",
                Student.phone, " ",
                Student.course, " ",
                Student.student_number
            )
        )

        if search:
            query = query.filter(concat_field.like(f"%{search}%"))

        if course != "ALL":
            query = query.filter(Student.course == course)

        if start_date and end_date:
            query = query.filter(
                func.date(Student.created_at).between(start_date, end_date)
            )

        if sort == "ASC":
            query = query.order_by(Student.created_at.asc())
        else:
            query = query.order_by(Student.created_at.desc())

        results = [{
            "id": s.id,
            "student_number": s.student_number,
            "student_name": s.student_name,
            "email": s.email,
            "phone": s.phone,
            "course": s.course,
            "created_at": s.created_at.strftime("%Y-%m-%d") if s.created_at else None,
            "profile_pic": profile_url(s.profile_pic)
        } for s in query.all()]

        return jsonify(results), 200

    except Exception:
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error"}), 500