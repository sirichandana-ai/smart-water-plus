import glob
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
from utils.preprocess import load_data, engineer_features, preprocess_features_labels

# 1. Load all CSVs
files = glob.glob("../simulation/data/*.csv")
df = load_data(files)

# 2. Feature engineering
df_feat = engineer_features(df, window=5)

# 3. Split features/labels
X, y, scaler = preprocess_features_labels(df_feat, label_col='label')

# 4. Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

# 5. Train RandomForestClassifier
rf_model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
rf_model.fit(X_train, y_train)

# 6. Evaluate
y_pred = rf_model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))

# 7. Save model + scaler
joblib.dump(rf_model, "../models/leak_detector.pkl")
joblib.dump(scaler, "../models/scaler.pkl")
print("Model and scaler saved successfully!")
