import sys
import json
import joblib
import pandas as pd
import numpy as np

def load_model(model_path):
    try:
        data = joblib.load(model_path)
        return data['model'], data['feature_columns']
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        sys.exit(1)

def predict(model, features, feature_columns):
    try:
        # Create a DataFrame with the features
        df = pd.DataFrame([features])
        
        # Ensure all required columns are present, fill missing with 0
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        # Reorder columns to match the model's training data
        df = df[feature_columns]
        
        # Make prediction
        prediction = model.predict(df)
        
        # Prediction is a 2D array (1, 3) since it's a MultiOutputRegressor
        return prediction[0].tolist()
    except Exception as e:
        print(f"Error during prediction: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python aiInference.py <json_features>", file=sys.stderr)
        sys.exit(1)
    
    model_path = 'backend/malware_model.pkl'
    model, feature_columns = load_model(model_path)
    
    try:
        input_data = json.loads(sys.argv[1])
        result = predict(model, input_data, feature_columns)
        
        if result:
            print(json.dumps({
                "status": "success",
                "predictions": result
            }))
        else:
            print(json.dumps({
                "status": "error",
                "message": "Prediction failed"
            }))
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
