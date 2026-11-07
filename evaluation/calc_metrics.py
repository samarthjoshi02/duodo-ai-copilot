import pandas as pd
import numpy as np

def calculate_metrics():
    df = pd.read_csv(r"d:\Duodo AI\evaluation\latency_results.csv")
    
    for op in df["operation"].unique():
        sub = df[df["operation"] == op]["latency_ms"]
        mean = sub.mean()
        median = sub.median()
        p95 = np.percentile(sub, 95)
        print(f"{op}: Mean={mean:.2f} ms, Median={median:.2f} ms, P95={p95:.2f} ms")

if __name__ == "__main__":
    calculate_metrics()
