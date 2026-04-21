from flask import Blueprint, request, jsonify
from extension import db
from models import Violation, Student
from helpers import parse_date_flexible
from datetime import date
import joblib
import os
import numpy as np
import re
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

# ==========================
# BLUEPRINT
# ==========================
violation_bp = Blueprint("violations", __name__, url_prefix="/violations")

# ==========================
# BASE PATH
# ==========================
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# ==========================
# LOAD MODELS
# ==========================
model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
vectorizer = joblib.load(os.path.join(BASE_DIR, "vectorizer.pkl"))
violation_to_section = joblib.load(os.path.join(BASE_DIR, "violation_to_section.pkl"))
dataset = joblib.load(os.path.join(BASE_DIR, "dataset.pkl"))

# ==========================
# ADDED: XLSX DATASET (DUAL SOURCE)
# ==========================
XLSX_PATH = os.path.join(BASE_DIR, "dataset.xlsx")

if os.path.exists(XLSX_PATH):
    dataset_xlsx = pd.read_excel(XLSX_PATH)
else:
    dataset_xlsx = pd.DataFrame(columns=["text", "violation"])

weird_vectorizer = joblib.load(os.path.join(BASE_DIR, "weird_vectorizer.pkl"))
weird_matrix = joblib.load(os.path.join(BASE_DIR, "weird_matrix.pkl"))

print("MODEL LOADED:", type(model))

# ==========================
# PREPROCESS
# ==========================
def preprocess(text):
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text


def clean_input(text):
    text = preprocess(text)
    return " ".join(text.split()[:80])

# ==========================
# WEIRD PHRASE (FIXED SAFE VERSION)
# ==========================
def is_weird_phrase(text, threshold=0.72):
    try:
        text = preprocess(text)
        vec = weird_vectorizer.transform([text])

        if vec.nnz == 0:
            return False

        score = cosine_similarity(vec, weird_matrix).max()
        return score >= threshold

    except:
        return False

# ==========================
# GIBBERISH (FULL MATCH TRAIN MODEL)
# ==========================
def is_gibberish(text):
    text = preprocess(text)

    if not text:
        return True

    words = text.split()

    if len(words) == 0:
        return True

    if not re.search(r"[a-zA-Z]", text):
        return True

    if len(words) == 1:
        w = words[0]
        if len(set(w)) <= 3 and len(w) > 6:
            return True

    if len(set(words)) <= max(2, int(len(words) * 0.3)):
        return True

    if np.mean([len(w) for w in words]) < 3:
        return True

    pattern_score = sum(1 for w in words if len(set(w)) <= 3)
    if len(words) > 0 and pattern_score / len(words) > 0.6:
        return True

    return False

# ==========================
# TOP PREDICTIONS
# ==========================
def get_top_predictions(vectorized, top_n=3):
    probs = model.predict_proba(vectorized)[0]
    classes = model.classes_

    top3 = np.argsort(probs)[::-1][:top_n]

    return [
        f"{classes[i]} ({probs[i]*100:.1f}%)"
        for i in top3
    ]

# ==========================
# STANDARD TEXT (DUAL DATA + DB + SAFE)
# ==========================
def get_best_standard_text(pred_label, input_text):

    input_vec = vectorizer.transform([preprocess(input_text)])

    best_text = None
    best_score = -1
    MIN_SIM = 0.22

    # ==========================
    # 1. dataset.pkl
    # ==========================
    subset = dataset[dataset["violation"] == pred_label]

    if not subset.empty:
        vec = vectorizer.transform(subset["text"].apply(preprocess))
        sim = cosine_similarity(input_vec, vec)[0]

        idx = int(np.argmax(sim))
        score = sim[idx]

        if score >= MIN_SIM:
            best_text = subset.iloc[idx]["text"]
            best_score = score

    # ==========================
    # 2. dataset.xlsx (ADDED)
    # ==========================
    if "dataset_xlsx" in globals():
        subset_x = dataset_xlsx[dataset_xlsx["violation"] == pred_label]

        if not subset_x.empty:
            vec_x = vectorizer.transform(subset_x["text"].apply(preprocess))
            sim_x = cosine_similarity(input_vec, vec_x)[0]

            idx = int(np.argmax(sim_x))
            score = sim_x[idx]

            if score >= MIN_SIM and score > best_score:
                best_text = subset_x.iloc[idx]["text"]
                best_score = score

    # ==========================
    # 3. DB fallback (ADDED)
    # ==========================
    db_records = Violation.query.filter_by(predicted_violation=pred_label).all()

    if db_records:
        texts = [preprocess(r.violation_text) for r in db_records if r.violation_text]

        if texts:
            vec_db = vectorizer.transform(texts)
            sim_db = cosine_similarity(input_vec, vec_db)[0]

            idx = int(np.argmax(sim_db))
            score = sim_db[idx]

            if score >= MIN_SIM and score > best_score:
                best_text = db_records[idx].violation_text

    return best_text if best_text else "No strong dataset match"

# ==========================
# GET ALL
# ==========================
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
            "standard_text": r.standard_text or "—",
            "is_resolved": r.is_resolved or ""
        }
        for r in records
    ])
# ==========================
# ADD VIOLATION
# ==========================
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

    text = data["violation_text"]
    text_proc = clean_input(text)

    if len(text_proc.split()) < 3:
        return jsonify({
            "message": "Input Invalid",
            "error_type": "invalid_text"
        }), 400

    vectorized = vectorizer.transform([text_proc])

    if is_gibberish(text_proc) or is_weird_phrase(text_proc):
        return jsonify({
            "message": "Invalid input detected",
            "error_type": "invalid_text"
        }), 400

    probs = model.predict_proba(vectorized)[0]
    classes = model.classes_

    confidence = float(np.max(probs))
    pred = classes[np.argmax(probs)]

    if confidence < 0.43:
        return jsonify({
            "message": "Low confidence prediction",
            "error_type": "invalid_text"
        }), 400

    top_preds = ", ".join(
        [f"{classes[i]} ({probs[i]*100:.1f}%)"
         for i in np.argsort(probs)[::-1][:3]]
    )

    section = violation_to_section.get(pred, "Unknown")

    standard_text = get_best_standard_text(pred, text_proc)

    new_record = Violation(
        student_name=data["student_name"],
        student_id=str(data["student_id"]),
        course_year_section=data["course_year_section"],
        gender=data["gender"],
        violation_text=text,
        violation_date=parse_date_flexible(data["violation_date"]),
        predicted_violation=pred,
        predicted_section=section,
        predictive_text=top_preds,
        standard_text=standard_text
    )

    db.session.add(new_record)
    db.session.commit()

    return jsonify({
        "message": "Violation added successfully",
        "predicted_violation": pred,
        "predicted_section": section,
        "predictive_text": top_preds,
        "standard_text": standard_text
    }), 201
# ==========================
# UPDATE VIOLATION
# ==========================
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

        if is_weird_phrase(text_proc):
            record.predicted_violation = "unknown"
            record.predicted_section = "unknown"
            record.predictive_text = "blocked"
            record.standard_text = "invalid input"
        else:
            record.predicted_violation = model.predict(vectorized)[0]
            record.predicted_section = violation_to_section.get(record.predicted_violation, "Unknown")
            record.predictive_text = " | ".join(get_top_predictions(vectorized))
            record.standard_text = get_best_standard_text(record.predicted_violation, record.violation_text)

    if "violation_date" in data:
        record.violation_date = parse_date_flexible(data["violation_date"])

    db.session.commit()
    return jsonify({"message": "Violation updated successfully"})

# ==========================
# Resolve
# ==========================
@violation_bp.put("/resolve/<int:id>")
def resolve_violation(id):

    record = Violation.query.get(id)

    if not record:
        return jsonify({"message": "Violation not found"}), 404

    # check if already resolved
    if record.is_resolved == "Resolved":
        return jsonify({"message": "Already resolved"}), 400

    record.is_resolved = "Resolved"

    db.session.commit()

    return jsonify({
        "message": "Violation marked as resolved",
        "id": record.id,
        "is_resolved": record.is_resolved or "Pending:"
    }), 200

# ==========================
# DELETE
# ==========================
@violation_bp.delete("/<int:id>")
def delete_violation(id):
    record = Violation.query.get(id)

    if not record:
        return jsonify({"message": "Violation not found"}), 404

    db.session.delete(record)
    db.session.commit()

    return jsonify({"message": "Violation deleted successfully"})

# ==========================
# SUMMARY
# ==========================
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

    # ONLY ACTIVE violations (not resolved)
    records = Violation.query.filter(
        Violation.student_id == str(student.student_number),
        Violation.is_resolved != "Resolved"
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
# ==========================
# HISTORY 
# ==========================
@violation_bp.get("/history/<student_number>")
def get_student_history(student_number):

    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify([]), 200

    records = Violation.query.filter(
        Violation.student_id == str(student.student_number),
        Violation.is_resolved != "Resolved"
    ).order_by(Violation.violation_date.desc()).all()

    # if no active violations, return empty list (0 behavior)
    if not records:
        return jsonify([]), 200

    return jsonify([
        {
            "predicted_violation": r.predicted_violation or "—",
            "predicted_section": r.predicted_section or "—",
            "violation_date": r.violation_date.strftime("%Y-%m-%d") if r.violation_date else "—"
        }
        for r in records
    ]), 200

# ==========================
# SEARCH
# ==========================
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
            "standard_text": r.standard_text  
        }
        for r in results
    ]), 200