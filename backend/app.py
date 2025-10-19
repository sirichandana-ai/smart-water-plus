from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import random
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ------------------------
# Load Models
# ------------------------
backend_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(backend_dir, "models")

# Leak detection model
try:
    leak_model = joblib.load(os.path.join(models_dir, "leak_detector.pkl"))
except:
    leak_model = None
    print("Leak model not found, using dummy values.")

# Forecast model
try:
    forecast_model = joblib.load(os.path.join(models_dir, "forecast.pkl"))
except:
    forecast_model = None
    print("Forecast model not found, using dummy values.")

# ------------------------
# Routes
# ------------------------

@app.route('/')
def home():
    return "Smart Water Management API Running!"

# 1️⃣ Predict leak
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    features = np.array([[data['pressure'], data['flow'], data['tank_level']]])
    
    if leak_model:
        pred_prob = leak_model.predict_proba(features)[0][1]
    else:
        pred_prob = 0.1  # dummy probability
    
    return jsonify({"leak_prob": float(pred_prob)})

# 2️⃣ Forecast demand
@app.route('/forecast', methods=['POST'])
def forecast():
    data = request.get_json()
    hist = np.array(data.get("historical_usage", [])).reshape(1, -1)
    
    if forecast_model:
        pred = forecast_model.predict(hist).tolist()
    else:
        pred = [0.5] * 24  # dummy 24h forecast
    
    return jsonify({"predicted_usage": pred})

# 3️⃣ Water allocation scheduler
@app.route('/schedule', methods=['POST'])
def schedule():
    data = request.get_json()
    houses = data.get("houses", 10)
    total_water = data.get("total_water", 100)
    
    allocation = [total_water / houses] * houses
    return jsonify({"allocation": allocation})

# 4️⃣ Simulate sensor data
@app.route('/simulate-data', methods=['GET'])
def simulate_data():
    data = {
        "pressure": round(random.uniform(5, 15), 2),
        "flow": round(random.uniform(0, 10), 2),
        "tank_level": round(random.uniform(50, 100), 2)
    }
    return jsonify(data)

# ------------------------
# Run app
# ------------------------
if __name__ == '__main__':
    app.run(debug=True)
