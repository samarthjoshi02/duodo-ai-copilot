# Duodo Sentiment Classification Evaluation Suite

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
- **Baseline (TF-IDF + LR):** Accuracy: **0.7500** | Macro F1: **0.6594**
- **Duodo Sentiment Engine (Duodo Sentiment Engine (qwen/qwen3.8-27b via Groq)):** Accuracy: **0.8633** | Macro F1: **0.8659**
- **Status:** **COMPLETE** (Evaluated using active cloud LLM provider Groq (qwen/qwen3.8-27b).)
