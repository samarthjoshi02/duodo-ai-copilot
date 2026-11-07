import os
import sys
import time
import pandas as pd
# pyrefly: ignore[missing-import]
import numpy as np
# pyrefly: ignore[missing-import]
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

sys.path.append(r"d:\Duodo AI")
from backend.services.ai_service import ai_service

def load_financial_phrasebank():
    print("Loading Financial PhraseBank dataset...")
    try:
        # pyrefly: ignore[missing-import]
        from datasets import load_dataset
        # Use sentences_50agree as it provides enough samples with good consensus
        dataset = load_dataset("financial_phrasebank", "sentences_50agree")
        df = pd.DataFrame(dataset['train'])
        
        # Original labels in datasets HF version: 0: negative, 1: neutral, 2: positive
        label_map = {0: "Bearish", 1: "Neutral", 2: "Bullish"}
        df['original_label'] = df['label'].map(label_map)
        df = df.rename(columns={'sentence': 'text'})
        return df[['text', 'original_label']]
    except Exception as e:
        print(f"Could not load via datasets: {e}")
        # Fallback to downloading a known CSV mirror if HF fails
        url = "https://raw.githubusercontent.com/datasets/financial-phrasebank/master/data/FinancialPhraseBank.csv"
        try:
            df = pd.read_csv(url)
            # Adapt according to columns if needed, but if this also fails, return None
            return None
        except:
            return None

def normalize_label(label):
    if pd.isna(label): return "Neutral"
    label = str(label).strip().lower()
    if label in ["positive", "bullish"]: return "Bullish"
    if label in ["negative", "bearish"]: return "Bearish"
    return "Neutral"

def evaluate():
    data_dir = r"d:\Duodo AI\evaluation\sentiment\data"
    out_dir = r"d:\Duodo AI\evaluation\sentiment"
    
    df = load_financial_phrasebank()
    if df is None:
        print("DATASET REQUIRED - NOT AVAILABLE")
        with open(os.path.join(out_dir, "evaluation_report.md"), "w") as f:
            f.write("# DATASET REQUIRED — NOT AVAILABLE\n")
        return False
        
    df['original_label'] = df['original_label'].apply(normalize_label)
    
    print(f"Total samples: {len(df)}")
    df.to_csv(os.path.join(data_dir, "financial_phrasebank.csv"), index=False)
    
    # 3. Create test set
    train_df, test_df = train_test_split(df, test_size=0.2, stratify=df['original_label'], random_state=42)
    
    # Limit test set to 300 if it's larger
    if len(test_df) > 300:
        test_df = test_df.groupby('original_label', group_keys=False).apply(lambda x: x.sample(int(300 * len(x)/len(test_df)), random_state=42))
        
    print(f"Test samples selected: {len(test_df)}")
    
    # 4. Train Baseline (TF-IDF + LR) on train_df
    print("Training Baseline (TF-IDF + Logistic Regression)...")
    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    X_train = vectorizer.fit_transform(train_df['text'])
    y_train = train_df['original_label']
    
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train, y_train)
    
    # Predict baseline on test
    X_test = vectorizer.transform(test_df['text'])
    test_df['baseline_label'] = lr_model.predict(X_test)
    
    # 5. Run Duodo Sentiment Engine on test_df
    print("Running Duodo Sentiment Engine...")
    duodo_labels = []
    latencies = []
    
    # Since mock model is fast, we can run it sequentially
    for text in test_df['text']:
        start_t = time.time()
        try:
            # using 'analyze_news_sentiment' which takes title, summary
            # We pass the text as title because the mock model only analyzes the title
            res = ai_service.analyze_news_sentiment(text, "")
            pred = normalize_label(res.get("sentiment", "Neutral"))
        except Exception as e:
            print(f"Duodo evaluation error: {e}")
            pred = "Neutral"
        latencies.append((time.time() - start_t) * 1000)
        duodo_labels.append(pred)
        
    test_df['duodo_label'] = duodo_labels
    test_df['latency_ms'] = latencies
    test_df['id'] = range(1, len(test_df) + 1)
    
    # Save final test set
    test_df[['id', 'text', 'original_label', 'duodo_label', 'baseline_label', 'latency_ms']].to_csv(os.path.join(data_dir, "test_set.csv"), index=False)
    
    # 7. Calculate Metrics
    y_true = test_df['original_label']
    y_base = test_df['baseline_label']
    y_duodo = test_df['duodo_label']
    
    labels_order = ["Bullish", "Bearish", "Neutral"]
    
    def get_metrics(y_true, y_pred):
        return {
            "Accuracy": accuracy_score(y_true, y_pred),
            "Precision": precision_score(y_true, y_pred, average='macro', zero_division=0),
            "Recall": recall_score(y_true, y_pred, average='macro', zero_division=0),
            "F1": f1_score(y_true, y_pred, average='macro', zero_division=0)
        }
        
    base_metrics = get_metrics(y_true, y_base)
    duodo_metrics = get_metrics(y_true, y_duodo)
    
    # Per class metrics
    def get_class_metrics(y_true, y_pred):
        res = []
        for c in labels_order:
            # treat c as positive class
            y_t = [1 if y == c else 0 for y in y_true]
            y_p = [1 if y == c else 0 for y in y_pred]
            res.append({
                "Class": c,
                "Precision": precision_score(y_t, y_p, zero_division=0),
                "Recall": recall_score(y_t, y_p, zero_division=0),
                "F1": f1_score(y_t, y_p, zero_division=0)
            })
        return pd.DataFrame(res)
        
    base_class = get_class_metrics(y_true, y_base)
    base_class['Model'] = 'Baseline'
    duodo_class = get_class_metrics(y_true, y_duodo)
    duodo_class['Model'] = 'Duodo Sentiment Engine'
    
    pd.concat([base_class, duodo_class]).to_csv(os.path.join(out_dir, "per_class_results.csv"), index=False)
    
    # Save main metrics
    main_res = pd.DataFrame([
        {"Model": "Baseline", **base_metrics},
        {"Model": "Duodo Sentiment Engine", **duodo_metrics}
    ])
    main_res.to_csv(os.path.join(out_dir, "sentiment_results.csv"), index=False)
    
    # 8. Confusion Matrices
    def plot_cm(y_true, y_pred, title, filename):
        cm = confusion_matrix(y_true, y_pred, labels=labels_order)
        plt.figure(figsize=(6,5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels_order, yticklabels=labels_order)
        plt.title(title)
        plt.ylabel('True')
        plt.xlabel('Predicted')
        plt.tight_layout()
        plt.savefig(filename)
        plt.close()
        
    plot_cm(y_true, y_base, "Baseline Confusion Matrix", os.path.join(out_dir, "baseline_confusion_matrix.png"))
    plot_cm(y_true, y_duodo, "Duodo Confusion Matrix", os.path.join(out_dir, "duodo_confusion_matrix.png"))
    
    # 9. Error Analysis
    err_df = test_df[['id', 'text', 'original_label', 'baseline_label', 'duodo_label']].copy()
    err_df['baseline_correct'] = err_df['original_label'] == err_df['baseline_label']
    err_df['duodo_correct'] = err_df['original_label'] == err_df['duodo_label']
    err_df.to_csv(os.path.join(out_dir, "error_analysis.csv"), index=False)
    
    total_base_err = (~err_df['baseline_correct']).sum()
    total_duodo_err = (~err_df['duodo_correct']).sum()
    
    # Write summary
    report = f"""
# Duodo Sentiment Classification Evaluation

## Dataset

Dataset: Financial PhraseBank
Source: HuggingFace (financial_phrasebank, sentences_50agree)
Total samples: {len(df)}
Training samples: {len(train_df)}
Test samples: {len(test_df)}

Bullish samples: {(y_true == 'Bullish').sum()}
Bearish samples: {(y_true == 'Bearish').sum()}
Neutral samples: {(y_true == 'Neutral').sum()}

## Experimental Configuration

Baseline: TF-IDF (max_features=5000) + LogisticRegression(max_iter=1000)
Duodo model: Rule-based Keyword Fallback (or Featherless AI if active)
Random seed: 42
Evaluation type: Macro-averaged

## TABLE I — SENTIMENT CLASSIFICATION PERFORMANCE

| Model/System | Accuracy | Precision | Recall | F1 |
|--------------|----------|-----------|--------|----|
| Baseline | {base_metrics['Accuracy']:.4f} | {base_metrics['Precision']:.4f} | {base_metrics['Recall']:.4f} | {base_metrics['F1']:.4f} |
| Duodo Sentiment Engine | {duodo_metrics['Accuracy']:.4f} | {duodo_metrics['Precision']:.4f} | {duodo_metrics['Recall']:.4f} | {duodo_metrics['F1']:.4f} |

## Confusion Matrices

- [Baseline Matrix](baseline_confusion_matrix.png)
- [Duodo Matrix](duodo_confusion_matrix.png)

## Error Analysis

Total errors for baseline: {total_base_err}
Total errors for Duodo: {total_duodo_err}

## Reproducibility

To reproduce:
`..\\backend\\venv\\Scripts\\python.exe run_sentiment_evaluation.py`
"""
    with open(os.path.join(out_dir, "evaluation_report.md"), "w") as f:
        f.write(report.strip())
        
    print("TABLE I — SENTIMENT CLASSIFICATION PERFORMANCE")
    print(f"\nBaseline:")
    print(f"Accuracy = {base_metrics['Accuracy']:.4f}")
    print(f"Precision = {base_metrics['Precision']:.4f}")
    print(f"Recall = {base_metrics['Recall']:.4f}")
    print(f"F1 = {base_metrics['F1']:.4f}")
    
    print(f"\nDuodo Sentiment Engine:")
    print(f"Accuracy = {duodo_metrics['Accuracy']:.4f}")
    print(f"Precision = {duodo_metrics['Precision']:.4f}")
    print(f"Recall = {duodo_metrics['Recall']:.4f}")
    print(f"F1 = {duodo_metrics['F1']:.4f}")
    
    print(f"\nDataset:")
    print(f"Test samples = {len(test_df)}")
    print(f"Bullish = {(y_true == 'Bullish').sum()}")
    print(f"Bearish = {(y_true == 'Bearish').sum()}")
    print(f"Neutral = {(y_true == 'Neutral').sum()}")
    
    print("\nExperiment status:")
    print("COMPLETE")

if __name__ == "__main__":
    evaluate()
