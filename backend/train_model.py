from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.metrics.pairwise import cosine_similarity

import pandas as pd
import numpy as np
import joblib
import string
import re

# ==========================
# LOAD DATASET
# ==========================
df = pd.read_excel(r"C:\Users\Harold Arevalo\Downloads\cvsu_violation_balanced.xlsx")

df = df.dropna(subset=['violation', 'text'])
df['violation'] = df['violation'].astype(str).str.strip().str.lower()
df['text'] = df['text'].astype(str)

print("Dataset preview:")
print(df.head(5))
print(f"\nTotal rows: {df.shape[0]}")
print(f"Unique texts: {df['text'].nunique()}")

print("\nViolation distribution:")
print(df['violation'].value_counts())

# ==========================
# PREPROCESSING
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
    words = text.split()
    return " ".join(words[:80])

texts = df['text'].apply(preprocess)
labels = df['violation']

# ==========================
# TRAIN / TEST SPLIT
# ==========================
X_train, X_test, y_train, y_test = train_test_split(
    texts,
    labels,
    test_size=0.2,
    random_state=42,
    stratify=labels
)

print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

# ==========================
# TF-IDF
# ==========================
vectorizer = FeatureUnion([
    ("word", TfidfVectorizer(
        ngram_range=(1, 3),
        min_df=2,
        max_df=0.90,
        sublinear_tf=True,
        strip_accents='unicode',
        stop_words='english',
        token_pattern=r"(?u)\b[a-zA-Z]+\b"
    )),

    ("char", TfidfVectorizer(
        analyzer='char_wb',
        ngram_range=(3, 6),
        min_df=3
    ))
])

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

print(f"\nTotal features: {X_train_tfidf.shape[1]}")

# ==========================
# MODEL
# ==========================
base_model = LinearSVC(class_weight='balanced', max_iter=3000)
model = CalibratedClassifierCV(base_model, cv=2, method='sigmoid')
model.fit(X_train_tfidf, y_train)

# ==========================
# EVALUATION
# ==========================
y_pred = model.predict(X_test_tfidf)

print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.2f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ==========================
# SAVE MODELS
# ==========================
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
joblib.dump(df, "dataset.pkl")

print("\nSaved: model, vectorizer, dataset")

# ==========================
# SECTION MAPPING
# ==========================
violation_to_section = df.groupby('violation')['section'].agg(
    lambda x: x.mode()[0] if not x.mode().empty else "Unknown"
).to_dict()

joblib.dump(violation_to_section, "violation_to_section.pkl")

print("Saved: violation_to_section")

# ==========================
# WEIRD PHRASES (FULL + EXPANDED)
# ==========================
weird_phrases = [
    "bawal unan","bawal upuan","bawal mesa","bawal bag","bawal pagkain",
    "illegal pillows","illegal pillow","illegal bags","illegal table",
    "illegal slippers","illegal phone case","illegal banana","illegal bananas",
    "illegal fruits","illegal burger","illegal rice","illegal candy",
    "illegal chocolate","illegal juice","illegal water","illegal blue",
    "illegal soft","illegal cute","illegal waters","illegal vehicles",
    "illegal game","illegal toy","illegal basketball","illegal mobile legends",
    "illegal random","illegal test","illegal haha","illegal chair","illegal desk",

    "drugs in classroom discussion","drug attendance issue",
    "cheating with drugs in paper","weapon during attendance",
    "bringing weapon for assignment","weapon in classroom discussion",
    "cheating the teacher behavior","cheating in school property",
    "cheating during physical fight","physical fight in exam paper",
    "assault in school project","absent with weapon possession",
    "late due to cheating activity","attendance using drugs system",
    "disrespecting property physically","verbal abuse of attendance",
    "insubordination in exam paper","vandalism in attendance record",
    "damage during drug possession","writing on weapon surface",

    # SPAM / GIBBERISH PATTERNS
    "asdf asdf asdf","qwe qwe qwe","zxc zxc zxc",
    "sdf sdf sdf","dfg dfg dfg","ghj ghj ghj",
    "aaaaa aaaaa","bbbb bbbb","cccc cccc",
    "xyz xyz xyz","lorem ipsum random text",
    "asdasdasdasdasd","sdfsdfsdfsdfsdf","qweqweqweqwe",
    "asdasd asdasd asdasd","random random random"
]

weird_clean = [preprocess(x) for x in weird_phrases]

weird_vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    min_df=1
)

weird_matrix = weird_vectorizer.fit_transform(weird_clean)

joblib.dump(weird_vectorizer, "weird_vectorizer.pkl")
joblib.dump(weird_matrix, "weird_matrix.pkl")

def is_weird_phrase(text, threshold=0.72):
    text = preprocess(text)
    vec = weird_vectorizer.transform([text])
    return cosine_similarity(vec, weird_matrix).max() >= threshold

# ==========================
# STRONG GIBBERISH DETECTOR (NEW FIX)
# ==========================
def is_gibberish(text):
    text = preprocess(text)

    if not text:
        return True

    words = text.split()

    if len(words) == 0:
        return True

    # ==========================
    # 1. PURE NON-ALPHABETIC (!!!! / 123123)
    # ==========================
    if not re.search(r"[a-zA-Z]", text):
        return True

    # ==========================
    # 2. EXTREME RANDOM CHAR STRINGS
    # (asdfasdfasdf, sdfdsfsdfsd, qweqweqwe)
    # ==========================
    if len(words) == 1:
        w = words[0]

        # too repetitive pattern like "sdsdsdsdsd"
        if len(set(w)) <= 3 and len(w) > 6:
            return True

        # no vowel + very long random string
        if not re.search(r"[aeiou]", w) and len(w) > 6:
            return True

    # ==========================
    # 3. REPETITION SPAM (word spam)
    # ==========================
    if len(set(words)) <= max(2, int(len(words) * 0.3)):
        return True

    # ==========================
    # 4. TOO MANY SHORT WORDS (noise typing)
    # ==========================
    avg_len = np.mean([len(w) for w in words])
    if avg_len < 3:
        return True

    # ==========================
    # 5. KEYBOARD SMASH PATTERN (sdf sdf sdf sdf)
    # ==========================
    pattern_score = sum(1 for w in words if len(set(w)) <= 3)
    if pattern_score / len(words) > 0.6:
        return True

    return False

# ==========================
# STANDARD TEXT MATCH
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
# FINAL PREDICT FUNCTION
# ==========================
def predict_violation(sentence, top_n=3):

    sentence_proc = clean_input(sentence)

    if is_gibberish(sentence_proc) or is_weird_phrase(sentence_proc):
        return {
            "input": sentence,
            "predicted_violation": "unknown",
            "predicted_section": "Unknown",
            "confidence": 0.0,
            "top_predictions": "unknown",
            "standard_text": "invalid input (gibberish detected)"
        }

    if len(sentence_proc.split()) < 3:
        return {
            "input": sentence,
            "predicted_violation": "unknown",
            "predicted_section": "Unknown",
            "confidence": 0.0,
            "top_predictions": "unknown",
            "standard_text": "invalid input"
        }

    vectorized = vectorizer.transform([sentence_proc])

    probs = model.predict_proba(vectorized)[0]
    classes = model.classes_

    top_indices = np.argsort(probs)[::-1][:top_n]

    confidence = float(max(probs))
    pred = classes[np.argmax(probs)]

    if confidence < 0.43:
        pred = "uncertain"
        top_preds = "unknown"
        section = "Unknown"
        standard = "No dataset match found"
    else:
        top_preds = ", ".join(
            [f"{classes[i]} ({probs[i]*100:.1f}%)" for i in top_indices]
        )

        section = violation_to_section.get(pred, "Unknown")
        standard = get_best_standard_text(pred, sentence_proc)

    return {
        "input": sentence,
        "predicted_violation": pred,
        "predicted_section": section,
        "confidence": confidence,
        "top_predictions": top_preds,
        "standard_text": standard
    }

# ==========================
# TEST
# ==========================
print("\n--- TEST ---")

tests = [
    "STUDENT USED PHONE DURING EXAM WITHOUT PERMISSION",
    "COPYING ANSWERS FROM CLASSMATE DURING QUIZ",
    "random nonsense xyz abc",
    "sdfdsfs sdfsdfss fsdfds",
    "asdasdasdasdasd asdasdasd asdasd",
    "aaaa bbbb cccc",
]

for t in tests:
    print(predict_violation(t))