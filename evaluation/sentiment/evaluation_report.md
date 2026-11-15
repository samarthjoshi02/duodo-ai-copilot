# Duodo Sentiment Classification Evaluation Report

## 1. Executive Summary & Research Integrity
- **Experiment Status:** **COMPLETE**
- **Status Reason:** Evaluated using active cloud LLM provider Groq (qwen/qwen3.8-27b).
- **Active Model Evaluated:** `Duodo Sentiment Engine (qwen/qwen3.8-27b via Groq)`
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
- **Full Dataset Size:** 4846 samples
  - Neutral: 2879 (59.41%)
  - Bullish: 1363 (28.13%)
  - Bearish: 604 (12.46%)
- **Data Split:**
  - 80% Stratified Training Pool: 3876 samples (used solely to fit the Baseline model)
  - 20% Testing Pool: 970 samples
  - **Selected Test Set:** Exactly **300** stratified samples (fixed random seed = 42)
  - **Test Set Distribution:** Neutral: 178 (59.33%), Bullish: 85 (28.33%), Bearish: 37 (12.33%)

---

## 3. Experimental Methodology
Both the Baseline model and the Duodo Sentiment Engine were evaluated on **the exact same 300 test sentences** with identical ground-truth targets.

1. **Baseline Model:**
   - Preprocessing: `TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))`
   - Classifier: `LogisticRegression(max_iter=1000, random_state=42)`
   - Trained exclusively on `X_train` (3,876 samples) to prevent data leakage.
2. **Duodo Sentiment Engine:**
   - Executed via `ai_service.analyze_news_sentiment(title=text, summary="")` in `backend/services/ai_service.py`.
   - Powered by `Duodo Sentiment Engine (qwen/qwen3.8-27b via Groq)` with zero-shot financial reasoning prompt and JSON format enforcement.

---

## 4. Evaluation Performance Results

### TABLE I — SENTIMENT CLASSIFICATION PERFORMANCE

| Model/System | Accuracy | Precision | Recall | F1 |
|---|---|---|---|---|
| Baseline | 0.7500 | 0.7503 | 0.6216 | 0.6594 |
| Duodo Sentiment Engine | 0.8633 | 0.8535 | 0.8803 | 0.8659 |

### Detailed Per-Class Breakdown

| Model | Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|---|
| Baseline | Bearish | 0.7619 | 0.4324 | 0.5517 | 37 |
| Baseline | Bullish | 0.7368 | 0.4941 | 0.5915 | 85 |
| Baseline | Neutral | 0.7523 | 0.9382 | 0.8350 | 178 |
| Duodo Sentiment Engine | Bearish | 0.8750 | 0.9459 | 0.9091 | 37 |
| Duodo Sentiment Engine | Bullish | 0.7802 | 0.8353 | 0.8068 | 85 |
| Duodo Sentiment Engine | Neutral | 0.9053 | 0.8596 | 0.8818 | 178 |

---

## 5. Confusion Matrices
- **Baseline Confusion Matrix:** `baseline_confusion_matrix.png`
- **Duodo Sentiment Engine Confusion Matrix:** `duodo_confusion_matrix.png`

---

## 6. Error Analysis
- **Total Test Samples:** 300
- **Both Correct:** 203 samples (67.7%)
- **Baseline Only Correct (Duodo Error):** 22 samples (7.3%)
- **Duodo Only Correct (Baseline Error):** 56 samples (18.7%)
- **Both Failed:** 19 samples (6.3%)

---

## 7. Instructions for Exact Reproduction
```powershell
# From project root: d:/Duodo AI
python evaluation/sentiment/run_sentiment_evaluation.py
```
All outputs are reproducibly generated inside `evaluation/sentiment/`.
