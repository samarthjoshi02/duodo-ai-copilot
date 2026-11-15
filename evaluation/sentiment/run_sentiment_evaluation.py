import os
import sys
import time
import zipfile
import tempfile
import pandas as pd
import numpy as np

# Set writable matplotlib config dir
os.environ["MPLCONFIGDIR"] = os.path.join(tempfile.gettempdir(), "matplotlib_duodo")
os.makedirs(os.environ["MPLCONFIGDIR"], exist_ok=True)

import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.services.ai_service import ai_service
from backend.config import settings

RANDOM_SEED = 42
TARGET_TEST_SAMPLES = 300
LABELS = ["Bearish", "Bullish", "Neutral"]
LABEL_MAP = {
    "positive": "Bullish",
    "negative": "Bearish",
    "neutral": "Neutral"
}

def load_financial_phrasebank():
    """
    Loads the human-annotated Financial PhraseBank dataset (50% consensus configuration)
    directly from HuggingFace dataset repository zip archive.
    """
    print("Loading Financial PhraseBank dataset...")
    try:
        from huggingface_hub import hf_hub_download
        zip_path = hf_hub_download(
            repo_id="financial_phrasebank",
            filename="data/FinancialPhraseBank-v1.0.zip",
            repo_type="dataset"
        )
        with zipfile.ZipFile(zip_path, 'r') as z:
            raw_text = z.read("FinancialPhraseBank-v1.0/Sentences_50Agree.txt").decode("iso-8859-1")
            
        data = []
        for line in raw_text.strip().split("\n"):
            line = line.strip()
            if not line or "@" not in line:
                continue
            sentence, label = line.rsplit("@", 1)
            sentence = sentence.strip()
            label = label.strip().lower()
            if label in LABEL_MAP:
                data.append({"text": sentence, "original_label": LABEL_MAP[label]})
                
        df = pd.DataFrame(data)
        print(f"Loaded {len(df)} human-annotated samples from Financial PhraseBank (50% consensus).")
        return df
    except Exception as e:
        print(f"Error loading Financial PhraseBank: {e}")
        return None

def probe_ai_api():
    """
    Probes Duodo AI Service (Groq or Featherless) to check operational status.
    """
    print(f"Probing Duodo AI Service provider: {ai_service.provider} ({ai_service.model_name})...")
    if ai_service.is_mocked or not ai_service.client:
        return False, "AIService is operating in Mock Mode."
    
    try:
        kwargs = {
            "model": ai_service.model_name,
            "messages": [{"role": "user", "content": "Respond with JSON: {\"sentiment\": \"Neutral\"}"}],
            "max_tokens": 20
        }
        if ai_service.provider == "groq":
            kwargs["response_format"] = {"type": "json_object"}
        res = ai_service.client.chat.completions.create(**kwargs)
        return True, f"API provider '{ai_service.provider}' ({ai_service.model_name}) is active and operational."
    except Exception as e:
        error_msg = str(e)
        print(f"AI API probe failed: {error_msg}")
        return False, error_msg

def plot_and_save_confusion_matrix(y_true, y_pred, labels, title, save_path):
    """Generates and saves a publication-quality confusion matrix heatmap."""
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=labels,
        yticklabels=labels,
        cbar=True,
        annot_kws={"size": 13, "weight": "bold"}
    )
    plt.title(title, fontsize=13, weight="bold", pad=12)
    plt.xlabel("Predicted Sentiment", fontsize=11, labelpad=8)
    plt.ylabel("Ground Truth Sentiment", fontsize=11, labelpad=8)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"Saved confusion matrix: {save_path}")

def run_evaluation():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Load Dataset
    df = load_financial_phrasebank()
    if df is None or len(df) == 0:
        print("FATAL: Ground truth dataset could not be loaded. Marking experiment INCOMPLETE.")
        return False

    total_dataset_size = len(df)
    full_class_counts = df["original_label"].value_counts().to_dict()
    print(f"Full Dataset Class Counts: {full_class_counts}")

    # 2. 80:20 Stratified Train/Test Split with Fixed Seed (42)
    train_df, test_pool = train_test_split(
        df,
        test_size=0.2,
        stratify=df["original_label"],
        random_state=RANDOM_SEED
    )

    # 3. Stratified Selection of Target 300 Test Samples
    stratified_targets = {"Neutral": 178, "Bullish": 85, "Bearish": 37}
    sampled_test_list = []
    for lbl, count in stratified_targets.items():
        sub_df = test_pool[test_pool["original_label"] == lbl]
        sampled_test_list.append(sub_df.sample(n=count, random_state=RANDOM_SEED))
    
    test_df = pd.concat(sampled_test_list).sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
    test_df["id"] = range(1, len(test_df) + 1)
    
    test_class_counts = test_df["original_label"].value_counts().to_dict()
    print(f"Test Set Size: {len(test_df)}, Class Distribution: {test_class_counts}")

    # 4. Train Baseline Model (TF-IDF + Logistic Regression) on Training Split
    print("\nTraining Baseline Model (TF-IDF + Logistic Regression)...")
    vectorizer = TfidfVectorizer(max_features=5000, stop_words="english", ngram_range=(1, 2))
    X_train = vectorizer.fit_transform(train_df["text"])
    y_train = train_df["original_label"]
    
    baseline_model = LogisticRegression(max_iter=1000, random_state=RANDOM_SEED)
    baseline_model.fit(X_train, y_train)

    # Predict Baseline on Test Set
    X_test = vectorizer.transform(test_df["text"])
    test_df["baseline_pred"] = baseline_model.predict(X_test)

    # 5. Evaluate Duodo Sentiment Engine
    api_available, api_msg = probe_ai_api()
    
    if api_available:
        experiment_status = "COMPLETE"
        active_model_desc = f"Duodo Sentiment Engine ({ai_service.model_name} via {ai_service.provider.capitalize()})"
        status_reason = f"Evaluated using active cloud LLM provider {ai_service.provider.capitalize()} ({ai_service.model_name})."
    else:
        experiment_status = "INCOMPLETE"
        active_model_desc = "Duodo Sentiment Engine (Rule-based Keyword Mock Fallback)"
        status_reason = f"Primary external API unavailable: {api_msg}."

    print(f"\nStatus: {experiment_status} | Active Engine: {active_model_desc}")
    print("Evaluating Duodo Sentiment Engine predictions on test set...")
    
    duodo_preds = []
    duodo_confs = []
    duodo_exps = []
    latencies = []

    for i, text in enumerate(test_df["text"]):
        t0 = time.time()
        res = ai_service.analyze_news_sentiment(title=text, summary="")
        dt = (time.time() - t0) * 1000.0
        latencies.append(round(dt, 2))
        
        pred = res.get("sentiment", "Neutral")
        if pred not in LABELS:
            pred = "Neutral"
        duodo_preds.append(pred)
        duodo_confs.append(res.get("confidence", 50.0))
        duodo_exps.append(res.get("explanation", ""))

        if (i + 1) % 25 == 0 or (i + 1) == len(test_df):
            print(f"Processed {i + 1}/{len(test_df)} samples... (Latest latency: {dt:.1f}ms)")
        
        # Pacing to maintain rate-limit stability
        if ai_service.provider == "groq":
            time.sleep(0.4)

    test_df["duodo_pred"] = duodo_preds
    test_df["duodo_confidence"] = duodo_confs
    test_df["latency_ms"] = latencies
    test_df["explanation"] = duodo_exps

    # Save test_set.csv
    test_set_path = os.path.join(output_dir, "test_set.csv")
    test_df[["id", "text", "original_label", "baseline_pred", "duodo_pred", "duodo_confidence", "latency_ms"]].to_csv(test_set_path, index=False)
    print(f"Saved: {test_set_path}")

    # 6. Calculate Overall Metrics
    y_true = test_df["original_label"]
    y_base = test_df["baseline_pred"]
    y_duodo = test_df["duodo_pred"]

    base_acc = accuracy_score(y_true, y_base)
    base_prec = precision_score(y_true, y_base, average="macro", zero_division=0)
    base_rec = recall_score(y_true, y_base, average="macro", zero_division=0)
    base_f1 = f1_score(y_true, y_base, average="macro", zero_division=0)

    duodo_acc = accuracy_score(y_true, y_duodo)
    duodo_prec = precision_score(y_true, y_duodo, average="macro", zero_division=0)
    duodo_rec = recall_score(y_true, y_duodo, average="macro", zero_division=0)
    duodo_f1 = f1_score(y_true, y_duodo, average="macro", zero_division=0)

    summary_df = pd.DataFrame([
        {
            "Model/System": "Baseline",
            "Accuracy": round(base_acc, 4),
            "Precision": round(base_prec, 4),
            "Recall": round(base_rec, 4),
            "F1": round(base_f1, 4)
        },
        {
            "Model/System": "Duodo Sentiment Engine",
            "Accuracy": round(duodo_acc, 4),
            "Precision": round(duodo_prec, 4),
            "Recall": round(duodo_rec, 4),
            "F1": round(duodo_f1, 4)
        }
    ])
    results_path = os.path.join(output_dir, "sentiment_results.csv")
    summary_df.to_csv(results_path, index=False)
    print(f"Saved: {results_path}")

    # 7. Calculate Per-Class Metrics
    per_class_records = []
    for model_name, preds in [("Baseline", y_base), ("Duodo Sentiment Engine", y_duodo)]:
        report_dict = classification_report(y_true, preds, labels=LABELS, output_dict=True, zero_division=0)
        for lbl in LABELS:
            per_class_records.append({
                "Model": model_name,
                "Class": lbl,
                "Precision": round(report_dict[lbl]["precision"], 4),
                "Recall": round(report_dict[lbl]["recall"], 4),
                "F1-Score": round(report_dict[lbl]["f1-score"], 4),
                "Support": int(report_dict[lbl]["support"])
            })

    per_class_df = pd.DataFrame(per_class_records)
    per_class_path = os.path.join(output_dir, "per_class_results.csv")
    per_class_df.to_csv(per_class_path, index=False)
    print(f"Saved: {per_class_path}")

    # 8. Confusion Matrices
    base_cm_path = os.path.join(output_dir, "baseline_confusion_matrix.png")
    duodo_cm_path = os.path.join(output_dir, "duodo_confusion_matrix.png")
    plot_and_save_confusion_matrix(y_true, y_base, LABELS, "Baseline (TF-IDF + Logistic Regression) Confusion Matrix", base_cm_path)
    plot_and_save_confusion_matrix(y_true, y_duodo, LABELS, f"Duodo Sentiment Engine ({active_model_desc}) Confusion Matrix", duodo_cm_path)

    # 9. Error Analysis
    err_df = test_df[["id", "text", "original_label", "baseline_pred", "duodo_pred", "explanation"]].copy()
    err_df["baseline_correct"] = err_df["original_label"] == err_df["baseline_pred"]
    err_df["duodo_correct"] = err_df["original_label"] == err_df["duodo_pred"]
    
    error_types = []
    for _, row in err_df.iterrows():
        b_c = row["baseline_correct"]
        d_c = row["duodo_correct"]
        if b_c and d_c:
            error_types.append("Both Correct")
        elif b_c and not d_c:
            error_types.append("Duodo Only Error")
        elif not b_c and d_c:
            error_types.append("Baseline Only Error")
        else:
            error_types.append("Both Failed")
    err_df["error_category"] = error_types

    err_analysis_path = os.path.join(output_dir, "error_analysis.csv")
    err_df.to_csv(err_analysis_path, index=False)
    print(f"Saved: {err_analysis_path}")

    # 10. Generate evaluation_report.md
    report_content = f"""# Duodo Sentiment Classification Evaluation Report

## 1. Executive Summary & Research Integrity
- **Experiment Status:** **{experiment_status}**
- **Status Reason:** {status_reason}
- **Active Model Evaluated:** `{active_model_desc}`
- **Baseline Model:** `TF-IDF (5,000 features, 1-2 ngrams) + Logistic Regression (max_iter=1000)`
- **Evaluation Principles:** Zero synthetic data generation; no LLM-generated ground truth; 100% genuine human-annotated financial text; strictly isolated train and test splits.

---

## 2. Dataset Information & Citation
- **Dataset:** Financial PhraseBank (50% consensus configuration)
- **Source:** HuggingFace Datasets Repository (`financial_phrasebank`)
- **Citation:** Malo, P., Sinha, A., Korhonen, P., Wallenius, J., & Takala, P. (2014). *Good debt or bad debt: Detecting semantic orientations in economic texts.* Journal of the Association for Information Science and Technology, 65(4), 782-796.
- **Label Alignment:**
  - `positive` → **Bullish**
  - `negative` → **Bearish**
  - `neutral` → **Neutral**
- **Full Dataset Size:** {total_dataset_size} samples
  - Neutral: {full_class_counts.get('Neutral', 0)} ({full_class_counts.get('Neutral', 0)/total_dataset_size*100:.2f}%)
  - Bullish: {full_class_counts.get('Bullish', 0)} ({full_class_counts.get('Bullish', 0)/total_dataset_size*100:.2f}%)
  - Bearish: {full_class_counts.get('Bearish', 0)} ({full_class_counts.get('Bearish', 0)/total_dataset_size*100:.2f}%)
- **Data Split:**
  - 80% Stratified Training Pool: {len(train_df)} samples (used solely to fit the Baseline model)
  - 20% Testing Pool: {len(test_pool)} samples
  - **Selected Test Set:** Exactly **{len(test_df)}** stratified samples (fixed random seed = 42)
  - **Test Set Distribution:** Neutral: {test_class_counts.get('Neutral', 0)} ({test_class_counts.get('Neutral', 0)/len(test_df)*100:.2f}%), Bullish: {test_class_counts.get('Bullish', 0)} ({test_class_counts.get('Bullish', 0)/len(test_df)*100:.2f}%), Bearish: {test_class_counts.get('Bearish', 0)} ({test_class_counts.get('Bearish', 0)/len(test_df)*100:.2f}%)

---

## 3. Experimental Methodology
Both the Baseline model and the Duodo Sentiment Engine were evaluated on **the exact same 300 test sentences** with identical ground-truth targets.

1. **Baseline Model:**
   - Preprocessing: `TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))`
   - Classifier: `LogisticRegression(max_iter=1000, random_state=42)`
   - Trained exclusively on `X_train` (3,876 samples) to prevent data leakage.
2. **Duodo Sentiment Engine:**
   - Executed via `ai_service.analyze_news_sentiment(title=text, summary="")` in `backend/services/ai_service.py`.
   - Powered by `{active_model_desc}` with zero-shot financial reasoning prompt and JSON format enforcement.

---

## 4. Evaluation Performance Results

### TABLE I — SENTIMENT CLASSIFICATION PERFORMANCE

| Model/System | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|
| Baseline | {base_acc:.4f} | {base_prec:.4f} | {base_rec:.4f} | {base_f1:.4f} |
| Duodo Sentiment Engine | {duodo_acc:.4f} | {duodo_prec:.4f} | {duodo_rec:.4f} | {duodo_f1:.4f} |

### Detailed Per-Class Breakdown

| Model | Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|---|
| Baseline | Bearish | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Bearish')]['Precision'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Bearish')]['Recall'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Bearish')]['F1-Score'].values[0]:.4f} | 37 |
| Baseline | Bullish | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Bullish')]['Precision'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Bullish')]['Recall'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Bullish')]['F1-Score'].values[0]:.4f} | 85 |
| Baseline | Neutral | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Neutral')]['Precision'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Neutral')]['Recall'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Baseline') & (per_class_df['Class']=='Neutral')]['F1-Score'].values[0]:.4f} | 178 |
| Duodo Sentiment Engine | Bearish | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Bearish')]['Precision'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Bearish')]['Recall'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Bearish')]['F1-Score'].values[0]:.4f} | 37 |
| Duodo Sentiment Engine | Bullish | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Bullish')]['Precision'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Bullish')]['Recall'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Bullish')]['F1-Score'].values[0]:.4f} | 85 |
| Duodo Sentiment Engine | Neutral | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Neutral')]['Precision'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Neutral')]['Recall'].values[0]:.4f} | {per_class_df[(per_class_df['Model']=='Duodo Sentiment Engine') & (per_class_df['Class']=='Neutral')]['F1-Score'].values[0]:.4f} | 178 |

---

## 5. Confusion Matrices
- **Baseline Confusion Matrix:** `baseline_confusion_matrix.png`
- **Duodo Sentiment Engine Confusion Matrix:** `duodo_confusion_matrix.png`

---

## 6. Error Analysis
- **Total Test Samples:** 300
- **Both Correct:** {(err_df['error_category'] == 'Both Correct').sum()} samples ({(err_df['error_category'] == 'Both Correct').sum()/300*100:.1f}%)
- **Baseline Only Correct (Duodo Error):** {(err_df['error_category'] == 'Duodo Only Error').sum()} samples ({(err_df['error_category'] == 'Duodo Only Error').sum()/300*100:.1f}%)
- **Duodo Only Correct (Baseline Error):** {(err_df['error_category'] == 'Baseline Only Error').sum()} samples ({(err_df['error_category'] == 'Baseline Only Error').sum()/300*100:.1f}%)
- **Both Failed:** {(err_df['error_category'] == 'Both Failed').sum()} samples ({(err_df['error_category'] == 'Both Failed').sum()/300*100:.1f}%)

---

## 7. Instructions for Exact Reproduction
```powershell
# From project root: d:/Duodo AI
python evaluation/sentiment/run_sentiment_evaluation.py
```
All outputs are reproducibly generated inside `evaluation/sentiment/`.
"""
    report_file_path = os.path.join(output_dir, "evaluation_report.md")
    with open(report_file_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"Saved: {report_file_path}")

    # 11. Generate README.md
    readme_content = f"""# Duodo Sentiment Classification Evaluation Suite

This directory contains the reproducible benchmark comparing the **Baseline model** (TF-IDF + Logistic Regression) against the **Duodo Sentiment Engine** (`backend/services/ai_service.py`).

## Files in this Directory

| File | Description |
|---|---|
| `run_sentiment_evaluation.py` | Standalone executable benchmark script executing data loading, splitting, training, evaluation, and reporting. |
| `test_set.csv` | Exact 300 test sentences from Financial PhraseBank with ground truth and model predictions. |
| `sentiment_results.csv` | Overall classification metrics (Accuracy, Macro Precision, Macro Recall, Macro F1). |
| `per_class_results.csv` | Class-level performance metrics for Bearish, Bullish, and Neutral classes. |
| `error_analysis.csv` | Granular per-sample comparison categorizing model agreements and failure modes. |
| `baseline_confusion_matrix.png` | Confusion matrix heatmap for the Baseline model. |
| `duodo_confusion_matrix.png` | Confusion matrix heatmap for the Duodo Sentiment Engine. |
| `evaluation_report.md` | Formal evaluation report conforming to academic and empirical benchmarking standards. |
| `README.md` | Quickstart documentation and experimental summary. |

## Quickstart & Reproduction

To reproduce the evaluation from scratch:

```powershell
# Navigate to project root
cd "d:/Duodo AI"

# Execute benchmark
python evaluation/sentiment/run_sentiment_evaluation.py
```

## Summary of Results

- **Dataset:** Financial PhraseBank (4,846 samples, 80:20 stratified split, 300 test samples)
- **Baseline (TF-IDF + LR):** Accuracy: **{base_acc:.4f}** | Macro F1: **{base_f1:.4f}**
- **Duodo Sentiment Engine ({active_model_desc}):** Accuracy: **{duodo_acc:.4f}** | Macro F1: **{duodo_f1:.4f}**
- **Status:** **{experiment_status}** ({status_reason})
"""
    readme_path = os.path.join(output_dir, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    print(f"Saved: {readme_path}")

    print("\n" + "="*60)
    print("TABLE I — SENTIMENT CLASSIFICATION PERFORMANCE")
    print("="*60)
    print(summary_df.to_string(index=False))
    print("="*60)
    print(f"Dataset Size: {total_dataset_size}")
    print(f"Test-Set Size: {len(test_df)}")
    print(f"Class Distribution: {test_class_counts}")
    print(f"Experiment Status: {experiment_status} ({status_reason})")
    print("="*60)

    return True

if __name__ == "__main__":
    run_evaluation()
