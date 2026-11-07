# Duodo Research Paper Evaluation Report

## A. Experimental Environment
- **Python version**: 3.13 (via virtual environment)
- **Libraries/packages**: FastAPI, requests, pandas, numpy, openai, uvicorn
- **Model names/versions**: Mistral-7B-Instruct-v0.2 (via Featherless AI) / Rule-based Keyword Counting (Mock Fallback)
- **Dataset name/source**: NOT AVAILABLE (No dataset provided in project repository)
- **Number of samples**: NOT AVAILABLE
- **Hardware/environment if available**: Windows, CPU environment

## B. Dataset
- **Total samples**: NOT AVAILABLE
- **Training samples**: NOT AVAILABLE 
- **Validation samples**: NOT AVAILABLE
- **Test samples**: NOT AVAILABLE
- **Sentiment class distribution**: NOT AVAILABLE

## C. Sentiment Results
*Note: The project does not contain a test dataset. A baseline could not be trained or executed. Results are marked as NOT AVAILABLE. Scripts for reproducibility have been created that generate the structural schema required for evaluation once data becomes available.*

- **Baseline Accuracy**: NOT AVAILABLE
- **Baseline Precision**: NOT AVAILABLE
- **Baseline Recall**: NOT AVAILABLE
- **Baseline F1**: NOT AVAILABLE
- **Duodo Accuracy**: NOT AVAILABLE
- **Duodo Precision**: NOT AVAILABLE
- **Duodo Recall**: NOT AVAILABLE
- **Duodo F1**: NOT AVAILABLE
- **Per-class metrics**: NOT AVAILABLE
- **Macro averages**: NOT AVAILABLE
- **Confusion matrices**: NOT AVAILABLE (Dummy image generated)

## D. Latency Results
Measurements taken directly against the running Duodo `FastAPI` instance using `fastapi.testclient` and Mock endpoints. 

- **Number of requests**: 30 per operation (90 total)
- **Mean**:
  - Sentiment Analysis: 486.11 ms
  - News Summary: 1623.06 ms
  - AI Copilot: 528.29 ms
- **Median**:
  - Sentiment Analysis: 407.72 ms
  - News Summary: 1527.83 ms
  - AI Copilot: 452.61 ms
- **P95**:
  - Sentiment Analysis: 902.42 ms
  - News Summary: 2065.49 ms
  - AI Copilot: 1094.76 ms
- **Minimum / Maximum**: See `latency_results.csv` for raw data.
- **Failed requests/timeouts**: 0

## E. Human Evaluation
*Note: The project does not contain any human evaluation data. A template `human_evaluation_template.csv` was generated based on the requested 1-5 Likert scale for future evaluators.*

- **Number of evaluators**: NOT AVAILABLE
- **Number of responses evaluated**: NOT AVAILABLE
- **Relevance mean**: NOT AVAILABLE
- **Clarity mean**: NOT AVAILABLE
- **Factual Consistency mean**: NOT AVAILABLE
- **Usefulness mean**: NOT AVAILABLE
- **Standard deviation**: NOT AVAILABLE

## F. Reproducibility
The following commands can be run from the `d:\Duodo AI` root to reproduce the experiments.

**1. Evaluate Latency**
```powershell
# From d:\Duodo AI\evaluation
..\backend\venv\Scripts\python.exe evaluate_latency.py
..\backend\venv\Scripts\python.exe calc_metrics.py
```

**2. Evaluate Sentiment (when dataset exists)**
```powershell
# From d:\Duodo AI\evaluation
..\backend\venv\Scripts\python.exe evaluate_sentiment.py
```

**3. Evaluate Human Performance (when dataset exists)**
```powershell
# From d:\Duodo AI\evaluation
..\backend\venv\Scripts\python.exe evaluate_human.py
```
