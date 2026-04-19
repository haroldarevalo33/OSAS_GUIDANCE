import joblib
import numpy as np
import re
from sklearn.metrics.pairwise import cosine_similarity

# ==========================
# LOAD MODELS
# ==========================
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")
df = joblib.load("dataset.pkl")
violation_to_section = joblib.load("violation_to_section.pkl")

weird_vectorizer = joblib.load("weird_vectorizer.pkl")
weird_matrix = joblib.load("weird_matrix.pkl")

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
# WEIRD CHECK
# ==========================
def is_weird_phrase(text, threshold=0.72):
    text = preprocess(text)
    if not text:
        return True
    vec = weird_vectorizer.transform([text])
    return cosine_similarity(vec, weird_matrix).max() >= threshold

# ==========================
# STRONG GIBBERISH DETECTOR (FIXED)
# ==========================
def is_gibberish(text):
    text = preprocess(text)

    if not text:
        return True

    words = text.split()

    if len(words) == 0:
        return True

    # 1. NO LETTERS AT ALL
    if not re.search(r"[a-zA-Z]", text):
        return True

    # 2. SINGLE WORD RANDOM STRING (sdfsdfsdf)
    if len(words) == 1:
        w = words[0]

        # repetitive characters (aaaaaaa, sssssss)
        if len(set(w)) <= 2 and len(w) > 5:
            return True

    # 3. REPETITION SPAM (sdf sdf sdf / asd asd)
    if len(set(words)) <= max(2, int(len(words) * 0.3)):
        return True

    # 4. TOO SHORT WORDS (noise typing)
    if np.mean([len(w) for w in words]) < 3:
        return True

    # 5. KEYBOARD SMASH PATTERN
    pattern_score = sum(1 for w in words if len(set(w)) <= 3)
    if pattern_score / len(words) > 0.6:
        return True

    return False

# ==========================
# PREDICT FUNCTION
# ==========================
def predict_violation(sentence, top_n=3):

    sentence_proc = clean_input(sentence)

    # INVALID INPUT CHECK FIRST
    if is_gibberish(sentence_proc) or is_weird_phrase(sentence_proc):
        return {
            "input": sentence,
            "predicted_violation": "unknown",
            "predicted_section": "Unknown",
            "confidence": 0.0,
            "top_predictions": "unknown",
            "standard_text": "invalid input (gibberish detected)"
        }

    # TOO SHORT INPUT
    if len(sentence_proc.split()) < 3:
        return {
            "input": sentence,
            "predicted_violation": "unknown",
            "predicted_section": "Unknown",
            "confidence": 0.0,
            "top_predictions": "unknown",
            "standard_text": "invalid input"
        }

    # ==========================
    # VECTORIZE
    # ==========================
    vectorized = vectorizer.transform([sentence_proc])

    probs = model.predict_proba(vectorized)[0]
    classes = model.classes_

    top_indices = np.argsort(probs)[::-1][:top_n]

    confidence = float(max(probs))
    pred = classes[np.argmax(probs)]

    # ==========================
    # LOW CONFIDENCE HANDLING
    # ==========================
    if confidence < 0.43:
        return {
            "input": sentence,
            "predicted_violation": "uncertain",
            "predicted_section": "Unknown",
            "confidence": confidence,
            "top_predictions": "unknown",
            "standard_text": "No dataset match found"
        }

    # ==========================
    # TOP PREDICTIONS
    # ==========================
    top_preds = ", ".join(
        [f"{classes[i]} ({probs[i]*100:.1f}%)" for i in top_indices]
    )

    section = violation_to_section.get(pred, "Unknown")

    subset = df[df['violation'] == pred]

    if subset.empty:
        standard = "No dataset match found"
    else:
        standard = subset.sample(1)['text'].values[0]

    return {
        "input": sentence,
        "predicted_violation": pred,
        "predicted_section": section,
        "confidence": confidence,
        "top_predictions": top_preds,
        "standard_text": standard
    }

# ==========================
# TERMINAL LOOP (USER INPUT)
# ==========================
print("\n==============================")
print("  VIOLATION PREDICTION TESTER ")
print("==============================")
print("Type 'exit' to stop\n")

while True:
    user_input = input("Enter text: ")

    if user_input.lower() == "exit":
        print("Exiting tester...")
        break

    result = predict_violation(user_input)

    print("\n--- RESULT ---")
    print("Input:", result["input"])
    print("Prediction:", result["predicted_violation"])
    print("Confidence:", round(result["confidence"], 3))
    print("Section:", result["predicted_section"])
    print("Top Predictions:", result["top_predictions"])
    print("Standard Text:", result["standard_text"])
    print("-" * 50)