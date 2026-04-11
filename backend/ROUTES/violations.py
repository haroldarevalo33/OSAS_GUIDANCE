from flask import Blueprint, request, jsonify
from app import db
from models import Violation, Student
from helpers import parse_date_flexible
from datetime import date
import joblib
import os
import string
import numpy as np

violation_bp = Blueprint("violations", __name__, url_prefix="/violations")

# ---------------- ML MODEL ----------------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
vectorizer = joblib.load(os.path.join(BASE_DIR, "vectorizer.pkl"))
violation_to_section = joblib.load(os.path.join(BASE_DIR, "violation_to_section.pkl"))

try:
    violation_to_standard_text = joblib.load(
        os.path.join(BASE_DIR, "violation_to_standard_text.pkl")
    )
except:
    violation_to_standard_text = {}

violation_to_standard_text = {
    str(k).strip().lower(): v
    for k, v in violation_to_standard_text.items()
}

# ---------------- PREPROCESS ----------------
def preprocess(text):
    if not text:
        return ""
    return text.lower().translate(str.maketrans("", "", string.punctuation))


def normalize(text):
    if not text:
        return ""
    return str(text).strip().lower()


def get_standard_text(label):
    return violation_to_standard_text.get(
        normalize(label),
        "No standard text available"
    )

# ---------------- GET ALL ----------------
@violation_bp.get("")
def get_all_violations():
    records = Violation.query.order_by(Violation.id.desc()).all()

    return jsonify([
        {
            "id": r.id,
            "student_name": r.student_name,
            "student_id": r.student_id,
            "course_year_section": r.course_year_section,
            "gender": r.gender,
            "violation_text": r.violation_text,
            "violation_date": (r.violation_date or date.today()).strftime("%Y-%m-%d"),
            "predicted_violation": r.predicted_violation or "—",
            "predicted_section": r.predicted_section or "—",
            "predictive_text": r.predictive_text or "—",
            "standard_text": get_standard_text(r.predicted_violation)
        }
        for r in records
    ])

# ---------------- POST ----------------
@violation_bp.post("")
def add_violation():
    data = request.json or {}

    required = [
        "student_name",
        "student_id",
        "course_year_section",
        "gender",
        "violation_text",
        "violation_date"
    ]

    for key in required:
        if not data.get(key):
            return jsonify({"message": f"Missing field: {key}"}), 400

    # ---------------- ML ----------------
    text_proc = preprocess(data["violation_text"])
    vectorized = vectorizer.transform([text_proc])

    predicted_violation = model.predict(vectorized)[0]
    predicted_section = violation_to_section.get(predicted_violation, "Unknown")

    # ---------------- TOP 3 ----------------
    try:
        probs = model.predict_proba(vectorized)[0]
        classes = model.classes_

        top = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)[:3]

        predictive_text = [
            f"{label} ({prob * 100:.1f}%)"
            for label, prob in top
        ]
    except:
        predictive_text = [str(predicted_violation)]

    # ---------------- SAVE ----------------
    new_record = Violation(
        student_name=data["student_name"],
        student_id=str(data["student_id"]),
        course_year_section=data["course_year_section"],
        gender=data["gender"],
        violation_text=data["violation_text"],
        violation_date=parse_date_flexible(data["violation_date"]),
        predicted_violation=predicted_violation,
        predicted_section=predicted_section,
        predictive_text=" | ".join(predictive_text),
        standard_text=get_standard_text(predicted_violation)
    )

    db.session.add(new_record)
    db.session.commit()

    return jsonify({
        "message": "Violation added successfully",
        "predicted_violation": predicted_violation,
        "predicted_section": predicted_section,
        "predictive_text": predictive_text,
        "standard_text": get_standard_text(predicted_violation)
    }), 201

# ---------------- PUT ----------------
@violation_bp.put("/<int:id>")
def update_violation(id):
    record = Violation.query.get(id)
    if not record:
        return jsonify({"message": "Violation not found"}), 404

    data = request.json or {}

    record.student_name = data.get("student_name", record.student_name)
    record.student_id = str(data.get("student_id", record.student_id))
    record.course_year_section = data.get("course_year_section", record.course_year_section)
    record.gender = data.get("gender", record.gender)

    if "violation_text" in data:
        record.violation_text = data["violation_text"]

        text_proc = preprocess(record.violation_text)
        vectorized = vectorizer.transform([text_proc])

        record.predicted_violation = model.predict(vectorized)[0]
        record.predicted_section = violation_to_section.get(
            record.predicted_violation,
            "Unknown"
        )

        try:
            probs = model.predict_proba(vectorized)[0]
            classes = model.classes_

            top = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)[:3]

            record.predictive_text = " | ".join([
                f"{label} ({prob * 100:.1f}%)"
                for label, prob in top
            ])
        except:
            record.predictive_text = record.predicted_violation

        record.standard_text = get_standard_text(record.predicted_violation)

    if "violation_date" in data:
        record.violation_date = parse_date_flexible(data["violation_date"])

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

# ---------------- SUMMARY ----------------
@violation_bp.get("/summary/<string:student_number>")
def get_student_summary(student_number):

    student = Student.query.filter_by(student_number=student_number).first()

    if not student:
        return jsonify({
            "visits": 0,
            "predicted_violation": "—",
            "predicted_section": "—",
            "violation_date": "—"
        }), 200

    records = Violation.query.filter_by(
        student_id=str(student.student_number)
    ).order_by(Violation.violation_date.desc()).all()

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

# ---------------- HISTORY ----------------
@violation_bp.get("/history/<student_number>")
def get_student_history(student_number):

    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify([]), 200

    records = Violation.query.filter_by(
        student_id=str(student.student_number)
    ).order_by(Violation.violation_date.desc()).all()

    return jsonify([
        {
            "predicted_violation": r.predicted_violation or "—",
            "predicted_section": r.predicted_section or "—",
            "violation_date": r.violation_date.strftime("%Y-%m-%d") if r.violation_date else "—"
        }
        for r in records
    ]), 200

# ---------------- SEARCH ----------------
@violation_bp.get("/search")
def search_violations():

    q = request.args.get("q", "").strip().upper()
    course = request.args.get("course", "ALL").strip().upper()
    start_date = request.args.get("startDate", "")
    end_date = request.args.get("endDate", "")
    sort = request.args.get("sort", "ASC").upper()

    sort = "ASC" if sort not in ["ASC", "DESC"] else sort

    query = Violation.query

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

    if course != "ALL":
        query = query.filter(db.func.upper(Violation.course_year_section).like(f"%{course}%"))

    if start_date and end_date:
        try:
            start = parse_date_flexible(start_date)
            end = parse_date_flexible(end_date)
            query = query.filter(Violation.violation_date.between(start, end))
        except:
            pass

    query = query.order_by(
        Violation.student_name.asc()
        if sort == "ASC"
        else Violation.student_name.desc()
    )

    results = query.all()

    return jsonify([
        {
            "id": r.id,
            "student_name": r.student_name,
            "student_id": r.student_id,
            "course_year_section": r.course_year_section,
            "gender": r.gender,
            "violation_text": r.violation_text,
            "violation_date": (r.violation_date or date.today()).strftime("%Y-%m-%d"),
            "predicted_violation": r.predicted_violation,
            "predicted_section": r.predicted_section,
            "predictive_text": r.predictive_text,
            "standard_text": get_standard_text(r.predicted_violation)
        }
        for r in results
    ]), 200