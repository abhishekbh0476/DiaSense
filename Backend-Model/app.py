"""
Flask API Server for Glucose Prediction Models
Provides REST endpoints for making predictions using trained RandomForest models
Run: python predictions_api.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import GlucosePredictor
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS to allow requests from frontend
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

# Global predictor instance
predictor = None

def init_app():
    """Initialize the application with predictor"""
    global predictor
    
    logger.info("🤖 Initializing Glucose Predictor...")
    try:
        model_path = os.path.join(os.path.dirname(__file__), "rf_glucose_model.pkl")
        predictor = GlucosePredictor(model_path)
        
        if predictor.is_loaded:
            logger.info("✅ Glucose Predictor initialized successfully!")
        else:
            logger.warning("⚠️  Warning: Models not loaded. Run train_model.py first.")
    except Exception as e:
        logger.error(f"❌ Error initializing predictor: {str(e)}")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/api/predictions/glucose', methods=['POST'])
def predict_glucose():
    """
    Predict glucose level from vital signs
    
    Request body:
    {
        "heart_rate": 75,
        "spo2": 97,
        "gsr": 0.5
    }
    
    Response:
    {
        "glucose_prediction": 125.45,
        "glucose_unit": "mg/dL",
        "diabetes_status": "Non-Diabetic",
        "status_confidence": 0.89,
        "risk_level": "normal",
        "recommendation": "✅ Glucose level is normal. Continue current routine."
    }
    """
    try:
        if not predictor or not predictor.is_loaded:
            logger.error("❌ Prediction model not initialized")
            return jsonify({
                'error': 'Prediction model not initialized',
                'status': 'error'
            }), 503
        
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json',
                'status': 'error'
            }), 400
        
        data = request.json
        logger.info(f"📨 Prediction request: {data}")
        
        # Validate input
        required_fields = ['heart_rate', 'spo2', 'gsr']
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields: {required_fields}")
            return jsonify({
                'error': f'Missing required fields: {required_fields}',
                'status': 'error'
            }), 400
        
        # Extract and convert values
        try:
            heart_rate = float(data['heart_rate'])
            spo2 = float(data['spo2'])
            gsr = float(data['gsr'])
        except (ValueError, TypeError) as e:
            logger.warning(f"Invalid input types: {str(e)}")
            return jsonify({
                'error': 'Invalid input values. Expected numbers.',
                'status': 'error'
            }), 400
        
        # Validate ranges
        if not (40 <= heart_rate <= 200):
            return jsonify({
                'error': 'Heart rate must be between 40-200 BPM',
                'status': 'error'
            }), 400
        
        if not (70 <= spo2 <= 100):
            return jsonify({
                'error': 'SpO2 must be between 70-100%',
                'status': 'error'
            }), 400
        
        if not (0 <= gsr <= 10):
            return jsonify({
                'error': 'GSR must be between 0-10',
                'status': 'error'
            }), 400
        
        # Get prediction
        logger.info("🤖 Making prediction...")
        result = predictor.predict_full(heart_rate, spo2, gsr)
        glucose = result['glucose_prediction']
        status = result['diabetes_status']
        confidence = result['status_confidence']
        
        # Determine risk level and recommendation
        if glucose < 70:
            risk_level = "low"
            recommendation = "⚠️ Low glucose detected. Consider consuming a quick-acting carbohydrate."
        elif 70 <= glucose <= 110:
            risk_level = "normal"
            recommendation = "✅ Glucose level is normal. Continue current routine."
        elif 110 <= glucose <= 140:
            risk_level = "elevated"
            recommendation = "⚡ Glucose is slightly elevated. Consider light activity or wait before next meal."
        elif 140 <= glucose <= 250:
            risk_level = "high"
            recommendation = "🔴 High glucose detected. Consult your healthcare provider if persistent."
        else:
            risk_level = "critical"
            recommendation = "🚨 CRITICAL: Seek immediate medical attention!"
        
        response = {
            'glucose_prediction': round(glucose, 2),
            'glucose_unit': 'mg/dL',
            'diabetes_status': status,
            'status_confidence': round(confidence, 4),
            'risk_level': risk_level,
            'recommendation': recommendation,
            'input': {
                'heart_rate': heart_rate,
                'spo2': spo2,
                'gsr': gsr
            },
            'timestamp': datetime.now().isoformat(),
            'status': 'success'
        }
        
        logger.info(f"✅ Prediction successful: {glucose:.2f} mg/dL ({status})")
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"❌ Error in predict_glucose: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/predictions/batch', methods=['POST'])
def batch_predict():
    """
    Make predictions on multiple samples
    
    Request body:
    {
        "samples": [
            {"heart_rate": 75, "spo2": 97, "gsr": 0.5},
            {"heart_rate": 105, "spo2": 94, "gsr": 0.75}
        ]
    }
    """
    try:
        if not predictor or not predictor.is_loaded:
            return jsonify({
                'error': 'Prediction model not initialized',
                'status': 'error'
            }), 503
        
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json',
                'status': 'error'
            }), 400
        
        data = request.json
        samples = data.get('samples', [])
        
        logger.info(f"📨 Batch prediction request: {len(samples)} samples")
        
        if not samples:
            return jsonify({
                'error': 'No samples provided',
                'status': 'error'
            }), 400
        
        predictions = []
        for i, sample in enumerate(samples):
            try:
                result = predictor.predict_full(
                    float(sample['heart_rate']),
                    float(sample['spo2']),
                    float(sample['gsr'])
                )
                predictions.append(result)
            except Exception as e:
                logger.warning(f"Failed to predict sample {i}: {str(e)}")
                predictions.append({
                    'error': str(e),
                    'input': sample
                })
        
        response = {
            'predictions': predictions,
            'total_samples': len(samples),
            'successful': len([p for p in predictions if 'error' not in p]),
            'timestamp': datetime.now().isoformat(),
            'status': 'success'
        }
        
        logger.info(f"✅ Batch prediction complete: {response['successful']}/{len(samples)} successful")
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"❌ Error in batch_predict: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/predictions/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy' if predictor and predictor.is_loaded else 'degraded',
        'model_loaded': predictor is not None and predictor.is_loaded,
        'endpoint': '/api/predictions/glucose',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/predictions/info', methods=['GET'])
def model_info():
    """Get information about the prediction model"""
    return jsonify({
        'model_type': 'RandomForest Ensemble',
        'features': ['HeartRate', 'SpO2', 'GSR'],
        'outputs': ['Glucose (mg/dL)', 'Diabetes Status'],
        'regressor': 'RandomForestRegressor (300 trees)',
        'classifier': 'RandomForestClassifier (300 trees)',
        'available_endpoints': {
            'predict': 'POST /api/predictions/glucose',
            'batch_predict': 'POST /api/predictions/batch',
            'health': 'GET /api/predictions/health',
            'info': 'GET /api/predictions/info'
        },
        'timestamp': datetime.now().isoformat()
    }), 200

# ============================================================================
# STARTUP
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("🏥 GLUCOSE PREDICTION API SERVER")
    print("=" * 70)
    
    # Initialize predictor
    init_app()
    
    print()
    print("📍 Available endpoints:")
    print("  • POST /api/predictions/glucose    - Single prediction")
    print("  • POST /api/predictions/batch      - Batch predictions")
    print("  • GET  /api/predictions/health     - Health check")
    print("  • GET  /api/predictions/info       - Model information")
    print()
    
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Starting server on http://localhost:{port}")
    print("=" * 70)
    print()
    
    app.run(debug=True, host='0.0.0.0', port=port)
