# test_model.py

import joblib
import numpy as np
import re
import time
from sklearn.metrics.pairwise import cosine_similarity

# ==========================
# LOAD SAVED FILES
# ==========================
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")
df = joblib.load("dataset.pkl")
violation_to_section = joblib.load("violation_to_section.pkl")

weird_vectorizer = joblib.load("weird_vectorizer.pkl")
weird_matrix = joblib.load("weird_matrix.pkl")

print("===================================")
print("   VIOLATION DETECTION TEST APP")
print("===================================")

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
# WEIRD PHRASE DETECTOR
# ==========================
def is_weird_phrase(text, threshold=0.72):

    text = preprocess(text)

    vec = weird_vectorizer.transform([text])

    similarity = cosine_similarity(vec, weird_matrix).max()

    return similarity >= threshold


# ==========================
# GIBBERISH DETECTOR
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

        if not re.search(r"[aeiou]", w) and len(w) > 6:
            return True

    if len(set(words)) <= max(2, int(len(words) * 0.3)):
        return True

    avg_len = np.mean([len(w) for w in words])

    if avg_len < 3:
        return True

    pattern_score = sum(1 for w in words if len(set(w)) <= 3)

    if pattern_score / len(words) > 0.6:
        return True

    return False


# ==========================
# BEST STANDARD MATCH
# ==========================
def get_best_standard_text(pred_label, input_text):

    subset = df[df['violation'] == pred_label]

    if subset.empty:
        return "No dataset match found"

    input_vec = vectorizer.transform([input_text])
    subset_vec = vectorizer.transform(subset['text'])

    sims = cosine_similarity(input_vec, subset_vec)[0]

    best_idx = np.argmax(sims)
    best_score = sims[best_idx]

    if best_score < 0.22:
        return "No strong dataset match"

    return subset.iloc[best_idx]['text']


# ==========================
# PREDICT FUNCTION
# ==========================
def predict_violation(sentence, top_n=3):

    start = time.perf_counter()

    sentence_proc = clean_input(sentence)

    # ==========================
# INVALID INPUT CHECK
# ==========================
    if (
        len(sentence_proc.split()) < 3
        or is_weird_phrase(sentence_proc)
    ):

        return {
            "input": sentence,
            "predicted_violation": "unknown",
            "predicted_section": "Unknown",
            "confidence": 0.0,
            "top_predictions": "unknown",
            "standard_text": "invalid input"
        }
    # VECTORIZE
    vec = vectorizer.transform([sentence_proc])

    # PREDICT
    probs = model.predict_proba(vec)[0]

    classes = model.classes_

    top_idx = np.argsort(probs)[::-1][:top_n]

    confidence = float(max(probs))

    pred = classes[np.argmax(probs)]

    # LOW CONFIDENCE
    if confidence < 0.43:

        pred = "uncertain"
        top_preds = "unknown"
        section = "Unknown"
        standard = "No dataset match"

    else:

        top_preds = ", ".join(
            f"{classes[i]} ({probs[i]*100:.1f}%)"
            for i in top_idx
        )

        section = violation_to_section.get(pred, "Unknown")

        standard = get_best_standard_text(pred, sentence_proc)

    end = time.perf_counter()

    return {
        "input": sentence,
        "predicted_violation": pred,
        "predicted_section": section,
        "confidence": round(confidence * 100, 2),
        "top_predictions": top_preds,
        "standard_text": standard,
        "prediction_time": f"{end - start:.6f} sec"
    }


# ==========================
# INTERACTIVE TEST
# ==========================
while True:

    print("\n-----------------------------------")
    user_input = input("Enter violation text: ")

    # EXIT
    if user_input.lower() in ["exit", "quit"]:

        print("\nExiting test app...")
        break

    result = predict_violation(user_input)

    print("\n========== RESULT ==========")

    print(f"Input               : {result['input']}")
    print(f"Predicted Violation : {result['predicted_violation']}")
    print(f"Predicted Section   : {result['predicted_section']}")
    print(f"Confidence          : {result['confidence']}%")
    print(f"Top Predictions     : {result['top_predictions']}")
    print(f"Standard Text       : {result['standard_text']}")
    print("============================")