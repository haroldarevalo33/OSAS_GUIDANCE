import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import string
import numpy as np

# ==========================
# LOAD DATASET
# ==========================
df = pd.read_excel(r"C:\Users\Harold Arevalo\Downloads\cvsu_violation_enhanced_v3.xlsx")

# Handle missing values
df = df.dropna(subset=['violation'])
df['violation'] = df['violation'].astype(str)
df['text'] = df['text'].astype(str)

# normalize labels
df['violation'] = df['violation'].str.strip().str.lower()

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
    if isinstance(text, str):
        return text.lower().translate(str.maketrans('', '', string.punctuation))
    return ''

texts = df['text'].apply(preprocess)
labels = df['violation']

# ==========================
# TRAIN / TEST SPLIT
# ==========================
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels,
    test_size=0.2,
    random_state=42,
    stratify=labels
)

print(f"\nTraining samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

# ==========================
# TF-IDF VECTORIZER
# ==========================
vectorizer = TfidfVectorizer(
    ngram_range=(1, 3),
    min_df=1,
    strip_accents='unicode',
    analyzer='word',
    sublinear_tf=True
)

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

print(f"\nTotal features generated: {len(vectorizer.get_feature_names_out())}")

# ==========================
# TRAIN MODEL
# ==========================
base_model = LinearSVC(class_weight='balanced', max_iter=2000)
model = CalibratedClassifierCV(base_model)
model.fit(X_train_tfidf, y_train)

# ==========================
# EVALUATION
# ==========================
y_pred = model.predict(X_test_tfidf)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nTest Accuracy: {accuracy:.2f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# ==========================
# CONFUSION MATRIX (ADDED)
# ==========================
cm = confusion_matrix(y_test, y_pred)

print("\nConfusion Matrix:")
print(cm)

# ==========================
# SAVE MODEL + VECTORIZER
# ==========================
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")
print("\nModel and vectorizer saved!")

# ==========================
# MAPPINGS
# ==========================
violation_to_section = dict(zip(df['violation'], df['section']))
joblib.dump(violation_to_section, "violation_to_section.pkl")
print("Violation to Section mapping saved!")

violation_to_standard_text = (
    df.groupby("violation")["text"]
    .first()
    .to_dict()
)

joblib.dump(violation_to_standard_text, "violation_to_standard_text.pkl")
print("Violation to Standard Text mapping saved!")

# ==========================
# PREPROCESS FUNCTION (TEST)
# ==========================
def preprocess(text):
    if isinstance(text, str):
        return text.lower().translate(str.maketrans('', '', string.punctuation))
    return ''

# ==========================
# TEST PREDICTION FUNCTION
# ==========================
def predict_violation(sentence, top_n=3):
    sentence_proc = preprocess(sentence)
    vectorized = vectorizer.transform([sentence_proc])
    pred = model.predict(vectorized)[0]

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(vectorized)[0]
        classes = model.classes_
        top_indices = np.argsort(probs)[::-1][:top_n]

        predictive_text = ", ".join(
            [f"{classes[i]} ({probs[i]*100:.1f}%)" for i in top_indices]
        )
    else:
        predictive_text = pred

    predicted_section = violation_to_section.get(pred, "Unknown")
    text = violation_to_standard_text.get(pred, "No sample text available")

    return {
        "input": sentence,
        "predicted_violation": pred,
        "predicted_section": predicted_section,
        "top_predictions": predictive_text,
        "standard_text": text
    }

print("\n--- Test Predictions ---")