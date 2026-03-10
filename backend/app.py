import os
import string
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from extension import db
import joblib
from PIL import Image, ImageDraw


def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")
    app.config["DEBUG"] = True

    # ------------------------------------------------
    # CORS
    # ------------------------------------------------
    CORS(
        app,
        origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        supports_credentials=True
    )

    # ------------------------------------------------
    # Upload folder
    # ------------------------------------------------
    upload_folder = "upload"
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder

    # ------------------------------------------------
    # Initialize DB
    # ------------------------------------------------
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

    # ------------------------------------------------
    # Load ML Model Files
    # ------------------------------------------------
    base_path = os.path.dirname(__file__)
    model = joblib.load(os.path.join(base_path, "model.pkl"))
    vectorizer = joblib.load(os.path.join(base_path, "vectorizer.pkl"))
    violation_to_section = joblib.load(
        os.path.join(base_path, "violation_to_section.pkl")
    )

    # Load standard text mapping if exists
    standard_text_path = os.path.join(base_path, "violation_to_standard_text.pkl")
    violation_to_standard_text = {}
    if os.path.exists(standard_text_path):
        violation_to_standard_text = joblib.load(standard_text_path)

    # ------------------------------------------------
    # Preprocessing function
    # ------------------------------------------------
    def preprocess(text: str) -> str:
        return text.lower().translate(str.maketrans("", "", string.punctuation))

    # ------------------------------------------------
    # Import Blueprints
    # ------------------------------------------------
    from routes.students import student_bp
    from routes.violations import violation_bp
    from routes.admin import admin_bp
    from routes.statistics import stats_bp
    from routes.news import news_bp
    from routes.upload_routes import upload_bp
    from routes.good_moral_request import good_moral_bp 

    # ------------------------------------------------
    # Register Blueprints
    # ------------------------------------------------
    app.register_blueprint(student_bp, url_prefix="/students")
    app.register_blueprint(violation_bp, url_prefix="/violations")
    app.register_blueprint(admin_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(good_moral_bp, url_prefix="/good-moral")  # ✅ Register Good Moral

    # ------------------------------------------------
    # ML Prediction Route
    # ------------------------------------------------
    @app.route("/predict", methods=["POST"])
    def predict_violation():
        data = request.get_json()
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "No input text provided"}), 400

        # Preprocess text
        text_proc = preprocess(text)
        vectorized = vectorizer.transform([text_proc])

        # Main Prediction
        predicted_violation = model.predict(vectorized)[0]
        predicted_section = violation_to_section.get(predicted_violation, "Unknown")

        # Predictive Text (Top 3)
        try:
            probs = model.predict_proba(vectorized)[0]
            classes = model.classes_
            top_idx = np.argsort(probs)[::-1][:3]

            predictive_text = [
                f"{classes[i]} ({probs[i] * 100:.1f}%)" for i in top_idx
            ]
        except Exception:
            predictive_text = [predicted_violation]

        # Standard text from dataset
        standard_text = violation_to_standard_text.get(
            predicted_violation, "No standard text available"
        )

        # Debug Log
        print("\n--- Prediction Log ---")
        print("Input:", text)
        print("Predicted:", predicted_violation)
        print("Section:", predicted_section)
        print("Top 3:", predictive_text)
        print("Standard Text:", standard_text)
        print("----------------------\n")

        return jsonify({
            "input": text,
            "predicted_violation": predicted_violation,
            "predicted_section": predicted_section,
            "predictive_text": predictive_text,
            "standard_text": standard_text
        })

    return app


# ============================================================
# RUN SERVER
# ============================================================
if __name__ == "__main__":
    app = create_app()

    # Ensure default admin image exists
    default_path = os.path.join(app.config['UPLOAD_FOLDER'], "default.png")
    if not os.path.exists(default_path):
        img = Image.new("RGB", (150, 150), color="gray")
        d = ImageDraw.Draw(img)
        d.text((45, 65), "Admin", fill=(255, 255, 255))
        img.save(default_path)

    print("\n=== REGISTERED ROUTES ===")
    print(app.url_map)
    print("========================\n")

    app.run(debug=True)