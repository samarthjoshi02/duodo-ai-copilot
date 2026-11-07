import time
import statistics
import csv
from fastapi.testclient import TestClient

import sys
sys.path.append(r"d:\Duodo AI")
from backend.main import app
from backend.services.ai_service import ai_service

def measure_latency():
    client = TestClient(app)
    headers = {"Authorization": "Bearer demo-token:123:test@example.com:Test User"}
    
    results = []
    
    print("Measuring News Summary (via stock details endpoint)...")
    for i in range(30):
        start_time = time.time()
        try:
            res = client.get("/api/market/stock/AAPL", headers=headers)
            lat = (time.time() - start_time) * 1000
            results.append({"operation": "News Summary", "latency_ms": lat, "status": "success"})
        except Exception as e:
            results.append({"operation": "News Summary", "latency_ms": 0, "status": f"failed: {str(e)}"})

    print("Measuring AI Copilot...")
    for i in range(30):
        start_time = time.time()
        try:
            res = client.post("/api/copilot/chat", json={"question": "What is the outlook for AAPL?"}, headers=headers)
            lat = (time.time() - start_time) * 1000
            results.append({"operation": "AI Copilot", "latency_ms": lat, "status": "success"})
        except Exception as e:
            results.append({"operation": "AI Copilot", "latency_ms": 0, "status": f"failed: {str(e)}"})

    print("Measuring Sentiment Analysis...")
    for i in range(30):
        start_time = time.time()
        try:
            ai_service.analyze_news_sentiment("Apple releases new iPhone", "The new iPhone has great features.")
            lat = (time.time() - start_time) * 1000
            results.append({"operation": "Sentiment Analysis", "latency_ms": lat, "status": "success"})
        except Exception as e:
            results.append({"operation": "Sentiment Analysis", "latency_ms": 0, "status": f"failed: {str(e)}"})

    with open(r"d:\Duodo AI\evaluation\latency_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["operation", "latency_ms", "status"])
        writer.writeheader()
        writer.writerows(results)
        
    print("Latency measurement complete. Results saved to latency_results.csv")

if __name__ == "__main__":
    measure_latency()
