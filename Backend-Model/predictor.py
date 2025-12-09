"""
Glucose Prediction Model - Inference & Prediction Utilities
Load trained models and make predictions on new data
"""

import pickle
import os
import numpy as np
from typing import Dict, Tuple

class GlucosePredictor:
    """Load and use trained glucose prediction models"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize the predictor with trained models
        
        Args:
            model_path: Path to the pickled model file (rf_glucose_model.pkl)
        """
        if model_path is None:
            # Default to current directory
            model_path = os.path.join(os.path.dirname(__file__), "rf_glucose_model.pkl")
        
        self.model_path = model_path
        self.regressor = None
        self.classifier = None
        self.is_loaded = False
        
        self.load_models()
    
    def load_models(self):
        """Load trained models from pickle file"""
        if not os.path.exists(self.model_path):
            print(f"⚠️  Model file not found at {self.model_path}")
            print("   Run train_model.py first to train and save models")
            return
        
        try:
            with open(self.model_path, "rb") as f:
                self.regressor, self.classifier = pickle.load(f)
            self.is_loaded = True
            print(f"✅ Models loaded successfully from {self.model_path}")
        except Exception as e:
            print(f"❌ Error loading models: {str(e)}")
            self.is_loaded = False
    
    def predict_glucose(self, heart_rate: float, spo2: float, gsr: float) -> float:
        """
        Predict glucose level from vital signs
        
        Args:
            heart_rate: Heart rate in BPM (e.g., 75)
            spo2: Blood oxygen saturation in % (e.g., 95)
            gsr: Galvanic Skin Response in microsiemens (e.g., 0.5)
        
        Returns:
            Predicted glucose level in mg/dL
        """
        if not self.is_loaded:
            raise Exception("Models not loaded. Check model_path.")
        
        # Prepare features
        features = np.array([[heart_rate, spo2, gsr]])
        
        # Predict
        glucose_prediction = self.regressor.predict(features)[0]
        
        return float(glucose_prediction)
    
    def predict_diabetes_status(self, heart_rate: float, spo2: float, gsr: float) -> Tuple[str, float]:
        """
        Predict diabetes status classification
        
        Args:
            heart_rate: Heart rate in BPM
            spo2: Blood oxygen saturation in %
            gsr: Galvanic Skin Response in microsiemens
        
        Returns:
            Tuple of (status, confidence_score)
            status: "Non-Diabetic", "Pre-Diabetic", or "Diabetic"
            confidence_score: Prediction confidence (0-1)
        """
        if not self.is_loaded:
            raise Exception("Models not loaded. Check model_path.")
        
        # Prepare features
        features = np.array([[heart_rate, spo2, gsr]])
        
        # Predict class
        status = self.classifier.predict(features)[0]
        
        # Get prediction probability
        probabilities = self.classifier.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
        
        return str(status), confidence
    
    def predict_full(self, heart_rate: float, spo2: float, gsr: float) -> Dict:
        """
        Get both glucose prediction and diabetes status
        
        Args:
            heart_rate: Heart rate in BPM
            spo2: Blood oxygen saturation in %
            gsr: Galvanic Skin Response in microsiemens
        
        Returns:
            Dictionary with glucose prediction and status classification
        """
        if not self.is_loaded:
            raise Exception("Models not loaded. Check model_path.")
        
        glucose = self.predict_glucose(heart_rate, spo2, gsr)
        status, confidence = self.predict_diabetes_status(heart_rate, spo2, gsr)
        
        return {
            "glucose_prediction": round(glucose, 2),
            "glucose_unit": "mg/dL",
            "diabetes_status": status,
            "status_confidence": round(confidence, 4),
            "input": {
                "heart_rate": heart_rate,
                "spo2": spo2,
                "gsr": gsr
            }
        }
    
    def batch_predict(self, data_list: list) -> list:
        """
        Make predictions on multiple samples
        
        Args:
            data_list: List of dicts with keys: heart_rate, spo2, gsr
        
        Returns:
            List of prediction results
        """
        results = []
        for data in data_list:
            result = self.predict_full(
                data["heart_rate"],
                data["spo2"],
                data["gsr"]
            )
            results.append(result)
        return results


# ============================================================================
# EXAMPLE USAGE
# ============================================================================
if __name__ == "__main__":
    print("=" * 70)
    print("🏥 GLUCOSE PREDICTOR - TEST")
    print("=" * 70)
    print()
    
    # Initialize predictor
    predictor = GlucosePredictor()
    
    if not predictor.is_loaded:
        print("❌ Models not loaded. Please run train_model.py first.")
        exit(1)
    
    print("✅ Models loaded and ready for predictions!")
    print()
    
    # ========================================================================
    # Test Case 1: Normal values
    # ========================================================================
    print("📊 Test Case 1: Normal vital signs")
    print("-" * 70)
    hr, spo2, gsr = 75, 97, 0.5
    print(f"Input: HeartRate={hr}, SpO2={spo2}%, GSR={gsr}")
    
    result = predictor.predict_full(hr, spo2, gsr)
    print(f"Output:")
    print(f"  • Predicted Glucose: {result['glucose_prediction']} {result['glucose_unit']}")
    print(f"  • Diabetes Status: {result['diabetes_status']}")
    print(f"  • Confidence: {result['status_confidence']*100:.2f}%")
    print()
    
    # ========================================================================
    # Test Case 2: Elevated values (potential pre-diabetic)
    # ========================================================================
    print("📊 Test Case 2: Elevated vital signs")
    print("-" * 70)
    hr, spo2, gsr = 105, 94, 0.75
    print(f"Input: HeartRate={hr}, SpO2={spo2}%, GSR={gsr}")
    
    result = predictor.predict_full(hr, spo2, gsr)
    print(f"Output:")
    print(f"  • Predicted Glucose: {result['glucose_prediction']} {result['glucose_unit']}")
    print(f"  • Diabetes Status: {result['diabetes_status']}")
    print(f"  • Confidence: {result['status_confidence']*100:.2f}%")
    print()
    
    # ========================================================================
    # Test Case 3: High values (potential diabetic)
    # ========================================================================
    print("📊 Test Case 3: High vital signs")
    print("-" * 70)
    hr, spo2, gsr = 115, 90, 0.9
    print(f"Input: HeartRate={hr}, SpO2={spo2}%, GSR={gsr}")
    
    result = predictor.predict_full(hr, spo2, gsr)
    print(f"Output:")
    print(f"  • Predicted Glucose: {result['glucose_prediction']} {result['glucose_unit']}")
    print(f"  • Diabetes Status: {result['diabetes_status']}")
    print(f"  • Confidence: {result['status_confidence']*100:.2f}%")
    print()
    
    # ========================================================================
    # Test Case 4: Batch predictions
    # ========================================================================
    print("📊 Test Case 4: Batch predictions")
    print("-" * 70)
    test_data = [
        {"heart_rate": 72, "spo2": 96, "gsr": 0.45},
        {"heart_rate": 98, "spo2": 93, "gsr": 0.65},
        {"heart_rate": 110, "spo2": 89, "gsr": 0.85},
    ]
    
    batch_results = predictor.batch_predict(test_data)
    for i, result in enumerate(batch_results, 1):
        print(f"  Sample {i}:")
        print(f"    • Input: HR={result['input']['heart_rate']}, SpO2={result['input']['spo2']}%, GSR={result['input']['gsr']}")
        print(f"    • Glucose: {result['glucose_prediction']} mg/dL")
        print(f"    • Status: {result['diabetes_status']} ({result['status_confidence']*100:.2f}%)")
    print()
    
    print("=" * 70)
    print("✅ All tests completed!")
    print("=" * 70)
