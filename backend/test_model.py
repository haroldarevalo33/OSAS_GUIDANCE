import joblib
import string
import numpy as np

# ---------------------
# 1. Load saved model
# ---------------------
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")
violation_to_section = joblib.load("violation_to_section.pkl")
violation_to_standard_text = joblib.load("violation_to_standard_text.pkl")

# ---------------------
# 2. Preprocess function
# ---------------------
def preprocess(text):
    if isinstance(text, str):
        return text.lower().translate(str.maketrans('', '', string.punctuation))
    return ""

# ---------------------
# 3. Prediction function
# ---------------------
def predict_violation(sentence, top_n=3):
    sentence_proc = preprocess(sentence)
    vectorized = vectorizer.transform([sentence_proc])
    
    pred = model.predict(vectorized)[0]

    # Predictive confidence (Top N)
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(vectorized)[0]
        classes = model.classes_

        top_idx = np.argsort(probs)[::-1][:top_n]
        predictive_text = ", ".join([
            f"{classes[i]} ({probs[i]*100:.1f}%)" for i in top_idx
        ])
    else:
        predictive_text = pred

    return {
        "input_text": sentence,
        "predicted_violation": pred,
        "predicted_section": violation_to_section.get(pred, "Unknown"),
        "predictive_text": predictive_text,
        "standard_text": violation_to_standard_text.get(pred, "No sample text")
    }

# ---------------------
# 4. Testing
# ---------------------
if __name__ == "__main__":
    test_sentences = [
        "Binato ang bintana sa classroom",
        "Student copied answers from classmate",
        "Nanapak ng kaklase sa hallway"
    ]

    for s in test_sentences:
        print("\nInput:", s)
        print(predict_violation(s))
