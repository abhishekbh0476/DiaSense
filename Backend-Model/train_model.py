"""
Glucose Prediction Model Training Script
Trains RandomForest models for glucose regression and diabetes classification
"""

import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, classification_report, confusion_matrix
import pickle
import os
import numpy as np
from datetime import datetime

# Configure paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(SCRIPT_DIR, "glucose_dataset.csv")
MODEL_PATH = os.path.join(SCRIPT_DIR, "rf_glucose_model.pkl")
METRICS_PATH = os.path.join(SCRIPT_DIR, "model_metrics.txt")

print("=" * 70)
print("🏥 GLUCOSE PREDICTION MODEL TRAINING")
print("=" * 70)
print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# ============================================================================
# 1. LOAD AND PREPARE DATA
# ============================================================================
print("📊 Step 1: Loading dataset...")
print(f"   Dataset path: {DATASET_PATH}")

try:
    df = pd.read_csv(DATASET_PATH)
    print(f"   ✅ Dataset loaded successfully!")
    print(f"   📈 Total records: {len(df)}")
    print(f"   📋 Columns: {list(df.columns)}")
    print()
except FileNotFoundError:
    print(f"❌ ERROR: Dataset not found at {DATASET_PATH}")
    exit(1)
except Exception as e:
    print(f"❌ ERROR loading dataset: {str(e)}")
    exit(1)

# Display dataset statistics
print("📊 Dataset Statistics:")
print(df.describe())
print()

# ============================================================================
# 2. PREPARE FEATURES AND TARGETS
# ============================================================================
print("🔧 Step 2: Preparing features and targets...")

# Features (input)
X = df[["HeartRate", "SpO2", "GSR"]]
print(f"   Features shape: {X.shape}")
print(f"   Feature columns: {list(X.columns)}")
print()

# Target 1: Glucose (Regression)
y_glucose = df["Glucose"]
print(f"   Regression target (Glucose) shape: {y_glucose.shape}")
print(f"   Glucose range: {y_glucose.min():.2f} - {y_glucose.max():.2f} mg/dL")
print(f"   Glucose mean: {y_glucose.mean():.2f} mg/dL")
print()

# Target 2: Diabetes Status Classification
print("   Creating diabetes classification labels...")
print("   Glucose ranges:")
print("     • Non-Diabetic:    0-110 mg/dL")
print("     • Pre-Diabetic:    110-140 mg/dL")
print("     • Diabetic:        >140 mg/dL")

df["Label"] = pd.cut(
    df["Glucose"],
    bins=[0, 110, 140, 1000],
    labels=["Non-Diabetic", "Pre-Diabetic", "Diabetic"]
)
y_status = df["Label"]

# Show classification distribution
print("   Classification distribution:")
label_counts = y_status.value_counts().sort_index()
for label, count in label_counts.items():
    percentage = (count / len(y_status)) * 100
    print(f"     • {label}: {count} samples ({percentage:.1f}%)")
print()

# ============================================================================
# 3. SPLIT DATA (80% train, 20% test)
# ============================================================================
print("🔀 Step 3: Splitting data (80% train, 20% test)...")

X_train, X_test, y_glucose_train, y_glucose_test, y_status_train, y_status_test = train_test_split(
    X, y_glucose, y_status, test_size=0.2, random_state=42
)

print(f"   Training set size: {len(X_train)} samples")
print(f"   Test set size: {len(X_test)} samples")
print()

# ============================================================================
# 4. TRAIN REGRESSION MODEL (Glucose Prediction)
# ============================================================================
print("🤖 Step 4: Training RandomForest Regression Model (300 trees)...")
print("   This model predicts glucose levels from HR, SpO2, GSR")

regressor = RandomForestRegressor(
    n_estimators=300,
    random_state=42,
    n_jobs=-1,
    verbose=1
)
regressor.fit(X_train, y_glucose_train)
print("   ✅ Regression model training complete!")
print()

# ============================================================================
# 5. EVALUATE REGRESSION MODEL
# ============================================================================
print("📊 Step 5: Evaluating Regression Model...")

# Training performance
y_glucose_pred_train = regressor.predict(X_train)
train_mse = mean_squared_error(y_glucose_train, y_glucose_pred_train)
train_rmse = np.sqrt(train_mse)
train_r2 = r2_score(y_glucose_train, y_glucose_pred_train)

print("   Training Set Metrics:")
print(f"     • MSE:  {train_mse:.4f}")
print(f"     • RMSE: {train_rmse:.4f} mg/dL")
print(f"     • R²:   {train_r2:.4f}")
print()

# Test performance
y_glucose_pred_test = regressor.predict(X_test)
test_mse = mean_squared_error(y_glucose_test, y_glucose_pred_test)
test_rmse = np.sqrt(test_mse)
test_r2 = r2_score(y_glucose_test, y_glucose_pred_test)

print("   Test Set Metrics:")
print(f"     • MSE:  {test_mse:.4f}")
print(f"     • RMSE: {test_rmse:.4f} mg/dL")
print(f"     • R²:   {test_r2:.4f}")
print()

# Feature importance for regression
print("   Feature Importance (Regression):")
feature_importance_reg = regressor.feature_importances_
for feat, importance in zip(["HeartRate", "SpO2", "GSR"], feature_importance_reg):
    print(f"     • {feat}: {importance:.4f} ({importance*100:.1f}%)")
print()

# ============================================================================
# 6. TRAIN CLASSIFICATION MODEL (Diabetes Status)
# ============================================================================
print("🤖 Step 6: Training RandomForest Classification Model (300 trees)...")
print("   This model predicts diabetes status (Non-Diabetic/Pre-Diabetic/Diabetic)")

classifier = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    n_jobs=-1,
    verbose=1
)
classifier.fit(X_train, y_status_train)
print("   ✅ Classification model training complete!")
print()

# ============================================================================
# 7. EVALUATE CLASSIFICATION MODEL
# ============================================================================
print("📊 Step 7: Evaluating Classification Model...")

# Training performance
y_status_pred_train = classifier.predict(X_train)
train_accuracy = accuracy_score(y_status_train, y_status_pred_train)

print("   Training Set Metrics:")
print(f"     • Accuracy: {train_accuracy:.4f} ({train_accuracy*100:.2f}%)")
print()

# Test performance
y_status_pred_test = classifier.predict(X_test)
test_accuracy = accuracy_score(y_status_test, y_status_pred_test)

print("   Test Set Metrics:")
print(f"     • Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
print()

# Detailed classification report
print("   Classification Report (Test Set):")
print(classification_report(y_status_test, y_status_pred_test))

# Confusion matrix
print("   Confusion Matrix (Test Set):")
cm = confusion_matrix(y_status_test, y_status_pred_test)
print(f"   {cm}")
print()

# Feature importance for classification
print("   Feature Importance (Classification):")
feature_importance_clf = classifier.feature_importances_
for feat, importance in zip(["HeartRate", "SpO2", "GSR"], feature_importance_clf):
    print(f"     • {feat}: {importance:.4f} ({importance*100:.1f}%)")
print()

# ============================================================================
# 8. SAVE MODELS
# ============================================================================
print("💾 Step 8: Saving trained models...")

try:
    with open(MODEL_PATH, "wb") as f:
        pickle.dump((regressor, classifier), f)
    print(f"   ✅ Models saved successfully!")
    print(f"   📁 Model file: {MODEL_PATH}")
    print(f"   📦 File size: {os.path.getsize(MODEL_PATH) / 1024:.2f} KB")
except Exception as e:
    print(f"   ❌ ERROR saving models: {str(e)}")
    exit(1)

print()

# ============================================================================
# 9. SAVE METRICS REPORT
# ============================================================================
print("📝 Step 9: Saving metrics report...")

report = f"""
GLUCOSE PREDICTION MODEL - TRAINING REPORT
{'=' * 70}
Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Dataset: {DATASET_PATH}

DATASET INFORMATION
{'=' * 70}
Total Samples: {len(df)}
Training Samples: {len(X_train)}
Test Samples: {len(X_test)}
Features: HeartRate, SpO2, GSR
Glucose Range: {y_glucose.min():.2f} - {y_glucose.max():.2f} mg/dL

REGRESSION MODEL (Glucose Prediction)
{'=' * 70}
Model: RandomForestRegressor (300 trees)
Training Metrics:
  - MSE: {train_mse:.4f}
  - RMSE: {train_rmse:.4f} mg/dL
  - R²: {train_r2:.4f}

Test Metrics:
  - MSE: {test_mse:.4f}
  - RMSE: {test_rmse:.4f} mg/dL
  - R²: {test_r2:.4f}

Feature Importance:
  - HeartRate: {feature_importance_reg[0]:.4f}
  - SpO2: {feature_importance_reg[1]:.4f}
  - GSR: {feature_importance_reg[2]:.4f}

CLASSIFICATION MODEL (Diabetes Status)
{'=' * 70}
Model: RandomForestClassifier (300 trees)
Classes: Non-Diabetic, Pre-Diabetic, Diabetic

Training Accuracy: {train_accuracy:.4f} ({train_accuracy*100:.2f}%)
Test Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)

Feature Importance:
  - HeartRate: {feature_importance_clf[0]:.4f}
  - SpO2: {feature_importance_clf[1]:.4f}
  - GSR: {feature_importance_clf[2]:.4f}

Confusion Matrix (Test Set):
{cm}

CLASSIFICATION REPORT (Test Set)
{classification_report(y_status_test, y_status_pred_test)}

MODEL FILES
{'=' * 70}
Location: {MODEL_PATH}
File Size: {os.path.getsize(MODEL_PATH) / 1024:.2f} KB
"""

try:
    with open(METRICS_PATH, "w") as f:
        f.write(report)
    print(f"   ✅ Metrics report saved!")
    print(f"   📁 Report file: {METRICS_PATH}")
except Exception as e:
    print(f"   ❌ ERROR saving metrics: {str(e)}")

print()

# ============================================================================
# 10. SUMMARY
# ============================================================================
print("=" * 70)
print("✅ MODEL TRAINING COMPLETE")
print("=" * 70)
print(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()
print("📊 FINAL RESULTS:")
print(f"   Regression Model R² (Test): {test_r2:.4f}")
print(f"   Regression Model RMSE (Test): {test_rmse:.4f} mg/dL")
print(f"   Classification Accuracy (Test): {test_accuracy*100:.2f}%")
print()
print("📁 Saved Files:")
print(f"   • {MODEL_PATH}")
print(f"   • {METRICS_PATH}")
print()
print("🚀 Next Steps:")
print("   1. Upload model file to Backend API")
print("   2. Integrate model predictions into /api/predictions endpoint")
print("   3. Use regressor for glucose forecasting")
print("   4. Use classifier for diabetes risk assessment")
print()
print("=" * 70)
