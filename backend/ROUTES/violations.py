from flask import Blueprint, request, jsonify
from app import db
from models import Violation
from helpers import parse_date_flexible
from datetime import date
import joblib
import os
import string
import numpy as np
from models import Student

violation_bp = Blueprint("violations", __name__, url_prefix="/violations")

# ---------------- ML MODEL ----------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
vectorizer = joblib.load(os.path.join(BASE_DIR, "vectorizer.pkl"))
violation_to_section = joblib.load(os.path.join(BASE_DIR, "violation_to_section.pkl"))

# Load Standard Text
try:
    violation_to_standard_text = joblib.load(os.path.join(BASE_DIR, "violation_to_standard_text.pkl"))
except:
    violation_to_standard_text = {}

# ---------------- Preprocessing ----------------
def preprocess(text):
    return text.lower().translate(str.maketrans('', '', string.punctuation))

# ---------------- GET ALL ----------------
@violation_bp.get("")
def get_all_violations():
    records = Violation.query.order_by(Violation.id.desc()).all()
    data = []

    for r in records:
        dt = r.violation_date or date.today()

        # Standard Text (optional)
        standard_text = violation_to_standard_text.get(r.predicted_violation, "No standard text available")

        data.append({
            "id": r.id,
            "student_name": r.student_name,
            "student_id": r.student_id,
            "course_year_section": r.course_year_section,
            "gender": r.gender,
            "violation_text": r.violation_text,
            "violation_date": dt.strftime("%Y-%m-%d"),
            "predicted_violation": r.predicted_violation or "—",
            "predicted_section": r.predicted_section or "—",
            "standard_text": standard_text
        })

    return jsonify(data)

# ---------------- POST ----------------
@violation_bp.post("")
def add_violation():
    data = request.json or {}
    required = ["student_name", "student_id", "course_year_section", "gender", "violation_text", "violation_date"]

    for key in required:
        if key not in data or not data[key]:
            return jsonify({"message": f"Missing field: {key}"}), 400

    # ML Prediction
    text_proc = preprocess(data["violation_text"])
    vectorized = vectorizer.transform([text_proc])

    predicted_violation = model.predict(vectorized)[0]
    predicted_section = violation_to_section.get(predicted_violation, "Unknown")

    # TOP 3 PREDICTIVE LIST
    try:
        probs = model.predict_proba(vectorized)[0]
        classes = model.classes_
        top_idx = np.argsort(probs)[::-1][:3]

        predictive_text = [
            f"{classes[i]} ({probs[i]*100:.1f}%)"
            for i in top_idx
        ]
    except:
        predictive_text = [predicted_violation]

    # Standard Text
    standard_text = violation_to_standard_text.get(predicted_violation, "No standard text available")

    new_record = Violation(
        student_name=data["student_name"],
        student_id=int(data["student_id"]),
        course_year_section=data["course_year_section"],
        gender=data["gender"],
        violation_text=data["violation_text"],
        violation_date=parse_date_flexible(data["violation_date"]),
        predicted_violation=predicted_violation,
        predicted_section=predicted_section
    )

    db.session.add(new_record)
    db.session.commit()

    return jsonify({
        "message": "Violation added successfully",
        "predicted_violation": predicted_violation,
        "predicted_section": predicted_section,
        "predictive_text": predictive_text,
        "standard_text": standard_text
    }), 201

# ---------------- PUT ----------------
@violation_bp.put("/<int:id>")
def update_violation(id):
    record = Violation.query.get(id)
    if not record:
        return jsonify({"message": "Violation not found"}), 404

    data = request.json or {}

    # Update basic fields
    record.student_name = data.get("student_name", record.student_name)
    record.student_id = int(data.get("student_id", record.student_id))
    record.course_year_section = data.get("course_year_section", record.course_year_section)
    record.gender = data.get("gender", record.gender)
    record.violation_text = data.get("violation_text", record.violation_text)

    if "violation_date" in data:
        record.violation_date = parse_date_flexible(data["violation_date"])

    # Re-Predict ML model if violation text changed
    if "violation_text" in data:
        text_proc = preprocess(record.violation_text)
        vectorized = vectorizer.transform([text_proc])

        record.predicted_violation = model.predict(vectorized)[0]
        record.predicted_section = violation_to_section.get(record.predicted_violation, "Unknown")

    db.session.commit()
    return jsonify({"message": "Violation updated successfully"})

# ---------------- DELETE ----------------
@violation_bp.delete("/<int:id>")
def delete_violation(id):
    record = Violation.query.get(id)
    if not record:
        return jsonify({"message": "Violation not found"}), 404

    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Violation deleted successfully"})


@violation_bp.get("/summary/<string:student_number>")
def get_student_summary(student_number):

    print("Fetching summary for student_number:", student_number)

    # Get student using student_number
    student = Student.query.filter_by(student_number=student_number).first()

    if not student:
        return jsonify({
            "visits": 0,
            "predicted_violation": "—",
            "predicted_section": "—",
            "violation_date": "—"
        }), 200

    # IMPORTANT FIX: Match violation.student_id (which stores student_number)
    records = Violation.query.filter_by(student_id=student.student_number) \
    .order_by(Violation.violation_date.desc()).all()


    print("Violations found:", records)

    if not records:
        return jsonify({
            "visits": 0,
            "predicted_violation": "—",
            "predicted_section": "—",
            "violation_date": "—"
        }), 200

    latest = records[0]

    return jsonify({
        "visits": len(records),
        "predicted_violation": latest.predicted_violation or "—",
        "predicted_section": latest.predicted_section or "—",
        "violation_date": latest.violation_date.strftime("%Y-%m-%d") if latest.violation_date else "—"
    }), 200

# ---------------- FULL HISTORY FOR STUDENT ----------------
@violation_bp.get("/history/<student_number>")
def get_student_history(student_number):

    student = Student.query.filter_by(student_number=student_number).first()

    if not student:
        return jsonify([]), 200

    # Same logic as summary — use student_number as string
    records = (
        Violation.query
        .filter_by(student_id=student.student_number)
        .order_by(Violation.violation_date.desc())
        .all()
    )

    output = []
    for r in records:
        output.append({
            "predicted_violation": r.predicted_violation or "—",
            "predicted_section": r.predicted_section or "—",
            "violation_date": r.violation_date.strftime("%Y-%m-%d") if r.violation_date else "—"
        })

    return jsonify(output), 200

# ---------------- ADVANCED SEARCH (WITH FILTERS) ----------------
@violation_bp.get("/search")
def search_violations():
    q = request.args.get("q", "").strip().upper()
    course = request.args.get("course", "ALL").strip().upper()
    start_date = request.args.get("startDate", "")
    end_date = request.args.get("endDate", "")
    sort = request.args.get("sort", "ASC").upper()

    sort = "ASC" if sort not in ["ASC", "DESC"] else sort

    # Base query
    query = Violation.query

    # MAIN TEXT QUERY
    if q:
        like_q = f"%{q}%"
        query = query.filter(
            db.or_(
                db.func.upper(Violation.student_name).like(like_q),
                db.func.upper(Violation.student_id.cast(db.String)).like(like_q),
                db.func.upper(Violation.course_year_section).like(like_q),
                db.func.upper(Violation.violation_text).like(like_q),
                db.func.upper(Violation.gender).like(like_q)
            )
        )

    # COURSE FILTER
    if course != "ALL":
        query = query.filter(db.func.upper(Violation.course_year_section).like(f"%{course}%"))

    # DATE RANGE
    if start_date and end_date:
        try:
            start = parse_date_flexible(start_date)
            end = parse_date_flexible(end_date)
            query = query.filter(Violation.violation_date.between(start, end))
        except:
            pass

    # SORT
    if sort == "ASC":
        query = query.order_by(Violation.student_name.asc())
    else:
        query = query.order_by(Violation.student_name.desc())

    results = query.all()
    output = []

    for r in results:
        dt = r.violation_date or date.today()
        standard_text = violation_to_standard_text.get(r.predicted_violation, "No standard text available")

        output.append({
            "id": r.id,
            "student_name": r.student_name,
            "student_id": r.student_id,
            "course_year_section": r.course_year_section,
            "gender": r.gender,
            "violation_text": r.violation_text,
            "violation_date": dt.strftime("%Y-%m-%d"),
            "predicted_violation": r.predicted_violation,
            "predicted_section": r.predicted_section,
            "standard_text": standard_text
        })

    return jsonify(output), 200
