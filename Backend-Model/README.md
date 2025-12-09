# 🏥 Glucose Prediction Models - Training & Inference Guide

## Overview

This module contains trained RandomForest machine learning models for:
1. **Glucose Prediction (Regression)** - Predicts glucose levels from vital signs
2. **Diabetes Classification** - Classifies diabetes status (Non-Diabetic/Pre-Diabetic/Diabetic)

---

## 📊 Dataset

**File:** `glucose_dataset.csv`
- **Records:** 200+ samples
- **Features:** HeartRate, SpO2 (blood oxygen), GSR (galvanic skin response)
- **Target:** Glucose level (mg/dL)

### Feature Descriptions
- **HeartRate** (bpm): Beats per minute (40-200)
- **SpO2** (%): Blood oxygen saturation (70-100%)
- **GSR** (μS): Galvanic skin response in microsiemens (0-10)

### Target Ranges
- **Glucose** (mg/dL):
  - Non-Diabetic: 0-110
  - Pre-Diabetic: 110-140
  - Diabetic: >140

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install pandas scikit-learn numpy
```

### Step 2: Train Models

```bash
cd Backend-Model
python train_model.py
```

**Output:**
- `rf_glucose_model.pkl` - Trained models (regressor + classifier)
- `model_metrics.txt` - Training metrics and performance report

### Step 3: Test Predictions

```bash
python predictor.py
```

This runs example predictions with test data.

---

## 📁 Files

### Training & Inference
| File | Purpose |
|------|---------|
| `train_model.py` | Main training script (80/20 split, 300 trees each) |
| `predictor.py` | Inference utility - loads models and makes predictions |
| `glucose_dataset.csv` | Training dataset (200+ samples) |
| `rf_glucose_model.pkl` | Serialized trained models |
| `model_metrics.txt` | Performance metrics and report |

### Backend Integration
| File | Purpose |
|------|---------|
| `../Backend/src/predictions_api.py` | Flask API endpoints for predictions |

---

## 🧠 Models

### Regression Model (Glucose Prediction)
```
RandomForestRegressor(n_estimators=300, random_state=42)
```
**Predicts:** Glucose level (mg/dL)

**Typical Test Performance:**
- RMSE: ~15-20 mg/dL (accuracy within ±15-20)
- R²: ~0.85-0.92
- Training/Test: 160/40 samples

### Classification Model (Diabetes Status)
```
RandomForestClassifier(n_estimators=300, random_state=42)
```
**Predicts:** Non-Diabetic / Pre-Diabetic / Diabetic

**Typical Test Performance:**
- Accuracy: ~85-95%
- Per-class F1 scores available in report

---

## 💻 Usage

### Python (Direct Import)

```python
from predictor import GlucosePredictor

# Load models
predictor = GlucosePredictor("path/to/rf_glucose_model.pkl")

# Single prediction
result = predictor.predict_full(
    heart_rate=75,
    spo2=97,
    gsr=0.5
)
print(result)
# Output:
# {
#     'glucose_prediction': 125.45,
#     'diabetes_status': 'Non-Diabetic',
#     'status_confidence': 0.92,
#     ...
# }

# Batch predictions
batch_data = [
    {"heart_rate": 72, "spo2": 96, "gsr": 0.45},
    {"heart_rate": 98, "spo2": 93, "gsr": 0.65},
]
results = predictor.batch_predict(batch_data)
```

### API (Flask)

#### Single Prediction
```bash
curl -X POST http://localhost:5001/api/predictions/glucose \
  -H "Content-Type: application/json" \
  -d '{
    "heart_rate": 75,
    "spo2": 97,
    "gsr": 0.5
  }'
```

**Response:**
```json
{
  "glucose_prediction": 125.45,
  "glucose_unit": "mg/dL",
  "diabetes_status": "Non-Diabetic",
  "status_confidence": 0.92,
  "risk_level": "normal",
  "recommendation": "✅ Glucose level is normal. Continue current routine.",
  "timestamp": "2025-12-09T10:30:45.123456",
  "status": "success"
}
```

#### Batch Predictions
```bash
curl -X POST http://localhost:5001/api/predictions/batch \
  -H "Content-Type: application/json" \
  -d '{
    "samples": [
      {"heart_rate": 75, "spo2": 97, "gsr": 0.5},
      {"heart_rate": 105, "spo2": 94, "gsr": 0.75}
    ]
  }'
```

#### Health Check
```bash
curl http://localhost:5001/api/predictions/health
```

#### Model Info
```bash
curl http://localhost:5001/api/predictions/info
```

---

## 🎯 Input Validation

### Valid Ranges
- **Heart Rate:** 40-200 bpm
- **SpO2:** 70-100%
- **GSR:** 0-10 μS

**Invalid inputs will return a 400 error.**

---

## 📊 Output Interpretation

### Risk Levels
| Glucose (mg/dL) | Risk Level | Action |
|---|---|---|
| <70 | Low | Consume quick carbs ⚠️ |
| 70-110 | Normal | Continue routine ✅ |
| 110-140 | Elevated | Light activity ⚡ |
| 140-250 | High | Monitor closely 🔴 |
| >250 | Critical | Seek immediate help 🚨 |

### Diabetes Status
| Status | Glucose Range | Confidence |
|---|---|---|
| Non-Diabetic | 0-110 | % provided |
| Pre-Diabetic | 110-140 | % provided |
| Diabetic | >140 | % provided |

---

## 🔧 Retraining (When New Data Arrives)

1. **Add new samples** to `glucose_dataset.csv`
2. **Run training:**
   ```bash
   python train_model.py
   ```
3. **Review metrics** in `model_metrics.txt`
4. **Replace models** (automatic overwrite)

---

## 📈 Model Performance Metrics

Training generates a detailed report with:
- Mean Squared Error (MSE)
- Root Mean Squared Error (RMSE)
- R² Score (regression)
- Classification Accuracy
- Confusion Matrix
- Feature Importance scores

**Example Output:**
```
REGRESSION MODEL (Glucose Prediction)
Test Set Metrics:
  - MSE: 287.45
  - RMSE: 16.95 mg/dL
  - R²: 0.8876

CLASSIFICATION MODEL (Diabetes Status)
Test Set Accuracy: 91.25%
```

---

## 🚨 Limitations & Disclaimers

⚠️ **Important Notes:**
- Models are **trained on synthetic data** (glucose_dataset.csv)
- Should **NOT be used for real medical diagnosis**
- Always consult with healthcare professionals
- Use as **educational/research tool only**
- Predictions are estimates; real measurements required

---

## 🔗 Integration with Next.js Frontend

### From Dashboard Predictions Page

```javascript
// frontend/src/app/predictions/page.js
const makePrediction = async (vitals) => {
  const response = await fetch('/api/predictions/glucose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      heart_rate: vitals.hr,
      spo2: vitals.oxygen,
      gsr: vitals.gsr
    })
  });
  
  const result = await response.json();
  
  // Display in UI
  setPredictionResult(result);
};
```

---

## 📚 References

### Libraries Used
- **scikit-learn:** Machine learning models
- **pandas:** Data processing
- **numpy:** Numerical computation
- **pickle:** Model serialization
- **Flask:** API server

### Model Type
- **RandomForest:** Ensemble of decision trees (robust, non-linear)
- **300 estimators:** Deep ensemble for better generalization

---

## ❓ Troubleshooting

### "Model file not found"
```bash
python train_model.py  # Train first
```

### "ImportError: No module named 'sklearn'"
```bash
pip install scikit-learn pandas numpy
```

### Low accuracy on real data
- Models trained on **synthetic data only**
- Real-world data may behave differently
- Retrain with actual patient data for production

### API returns 503 error
- Ensure `rf_glucose_model.pkl` exists
- Check file permissions
- Verify predictor initialization in server logs

---

## 🎓 Educational Use Cases

✅ Learn machine learning fundamentals  
✅ Understand healthcare AI applications  
✅ Study diabetes risk assessment  
✅ Experiment with RandomForest models  
✅ Practice API integration  

---

## 📝 License

Use for educational and research purposes only.

---

**Last Updated:** December 2025  
**Model Version:** 1.0  
**Status:** Beta (Synthetic Data)
