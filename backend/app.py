import os
import string
import re
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from extension import db
import joblib
from PIL import Image, ImageDraw
from sklearn.metrics.pairwise import cosine_similarity

from routes.violations import get_best_standard_text


def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")
    app.config["DEBUG"] = True

    # ==========================
    # CORS
    # ==========================
    CORS(
        app,
        origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        supports_credentials=True
    )

    # ==========================
    # Upload folder
    # ==========================
    upload_folder = "upload"
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder

    # ==========================
    # DB INIT
    # ==========================
    db.init_app(app)

    with app.app_context():
        from models import (
            Student,
            Admin,
            Violation,
            UploadedFile,
            GoodMoralRequest
        )
        db.create_all()

    # ==========================
    # LOAD MODELS
    # ==========================
    base_path = os.path.dirname(__file__)

    model = joblib.load(os.path.join(base_path, "model.pkl"))
    vectorizer = joblib.load(os.path.join(base_path, "vectorizer.pkl"))
    df = joblib.load(os.path.join(base_path, "dataset.pkl"))
    violation_to_section = joblib.load(os.path.join(base_path, "violation_to_section.pkl"))

    weird_vectorizer = joblib.load(os.path.join(base_path, "weird_vectorizer.pkl"))
    weird_matrix = joblib.load(os.path.join(base_path, "weird_matrix.pkl"))

    print("ML files loaded successfully.")
    print("MODEL TYPE:", type(model))

    # ==========================
    # PREPROCESS (MATCH TRAIN_MODEL.PY)
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
    # WEIRD PHRASE CHECK (MATCH TRAIN MODEL)
    # ==========================
    def is_weird_phrase(text, threshold=0.72):
        try:
            text = preprocess(text)
            vec = weird_vectorizer.transform([text])
            score = cosine_similarity(vec, weird_matrix).max()
            return score >= threshold
        except:
            return False

    # ==========================
    # GIBBERISH DETECTOR (MATCH TRAIN MODEL)
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
    # BLUEPRINTS
    # ==========================
    from routes.students import student_bp
    from routes.violations import violation_bp
    from routes.admin import admin_bp
    from routes.statistics import stats_bp
    from routes.news import news_bp
    from routes.upload_routes import upload_bp
    from routes.good_moral_request import good_moral_bp

    app.register_blueprint(student_bp, url_prefix="/students")
    app.register_blueprint(violation_bp, url_prefix="/violations")
    app.register_blueprint(admin_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(good_moral_bp, url_prefix="/good-moral")

    # ==========================
    # ML ROUTE
    # ==========================
    @app.route("/predict", methods=["POST"])
    def predict_violation():

        data = request.get_json()
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "No input text provided"}), 400

        text_proc = clean_input(text)

        # ==========================
        # VALIDATION
        # ==========================
        if is_gibberish(text_proc) or is_weird_phrase(text_proc):
            return jsonify({
                "input": text,
                "predicted_violation": "unknown",
                "predicted_section": "Unknown",
                "confidence": 0.0,
                "predictive_text": "unknown",
                "standard_text": "invalid input (Invalid Format detected)"
            })

        if len(text_proc.split()) < 3:
            return jsonify({
                "input": text,
                "predicted_violation": "unknown",
                "predicted_section": "Unknown",
                "confidence": 0.0,
                "predictive_text": "unknown",
                "standard_text": "invalid input"
            })

        # ==========================
        # ML PREDICTION (ALIGNED)
        # ==========================
        vectorized = vectorizer.transform([text_proc])

        probs = model.predict_proba(vectorized)[0]
        classes = model.classes_

        top_indices = np.argsort(probs)[::-1][:3]

        confidence = float(np.max(probs))
        pred = classes[np.argmax(probs)]

        # ==========================
        # APPLY TRAIN_MODEL LOGIC
        # ==========================
        if confidence < 0.43:
            pred = "Unknown"
            top_preds = "Unknown"
            section = "Unknown"
            standard_text = "Invalid Text"

        else:
            top_preds = ", ".join(
                [f"{classes[i]} ({probs[i]*100:.1f}%)" for i in top_indices]
            )

            section = violation_to_section.get(pred, "Unknown")

            standard_text = get_best_standard_text(pred, text_proc)

            if standard_text in ["No strong dataset match", "No dataset match found"]:
                standard_text = "invalid input"

        # ==========================
        # LOG
        # ==========================
        print("\n--- Prediction Log ---")
        print("Input:", text)
        print("Processed:", text_proc)
        print("Predicted:", pred)
        print("Section:", section)
        print("Top 3:", top_preds)
        print("Confidence:", confidence)
        print("Standard:", standard_text)
        print("----------------------\n")

        return jsonify({
            "input": text,
            "predicted_violation": pred,
            "predicted_section": section,
            "confidence": confidence,
            "predictive_text": top_preds,
            "standard_text": standard_text
        })

    return app


# ==========================
# RUN SERVER
# ==========================
if __name__ == "__main__":

    app = create_app()

    default_path = os.path.join(app.config["UPLOAD_FOLDER"], "default.png")

    if not os.path.exists(default_path):
        img = Image.new("RGB", (150, 150), color="gray")
        d = ImageDraw.Draw(img)
        d.text((45, 65), "Admin", fill=(255, 255, 255))
        img.save(default_path)

    print("\n=== REGISTERED ROUTES ===")
    print(app.url_map)
    print("========================\n")

    app.run(debug=True)