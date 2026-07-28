# DUODO AI - Next-Gen Financial Copilot & Portfolio Studio 🚀

DUODO AI is a premium, AI-powered financial dashboard and copilot designed for modern investors. It leverages advanced Large Language Models (LLMs) via Featherless AI and real-time market data to provide institutional-grade sentiment analysis, risk assessment, and portfolio tracking in a stunning, highly responsive dark-mode UI.

## ✨ Features

- **AI Copilot (`/copilot`)**: A ChatGPT-like conversational assistant that provides deep financial insights, stock analysis, and risk factors using Featherless AI's LLaMA 3 8B Instruct model.
- **Portfolio Studio (`/portfolio`)**: Track your asset allocations, calculate Profit/Loss metrics in real-time, and get AI-driven portfolio risk scoring. Includes one-click CSV Data Export.
- **Market Pulse (`/pulse`)**: Real-time ticker searches, Fear & Greed indexing, and Top Gainer/Loser tracking.
- **Secure Authentication**: Enterprise-grade Google Sign-In powered by Firebase Authentication.
- **Premium UI/UX**: Built with Tailwind CSS, Framer Motion, and Recharts. Features dynamic glassmorphism, fluid animations, and a polished dark-navy aesthetic.
- **Cloud Database Ready**: Fully integrated with Supabase PostgreSQL for fast, scalable, and secure user data storage.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript + Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS (with custom premium color palettes)
- **State/Caching**: React Query (TanStack Query)
- **Charts/Data Vis**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL) + `psycopg2`
- **AI Integration**: Featherless AI API (OpenAI compatible)
- **Auth Verification**: Firebase Admin SDK

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- A Supabase Account (for PostgreSQL)
- A Firebase Account (for Google Auth)
- A Featherless AI API Key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/duodo-ai.git
cd duodo-ai
```

### 2. Environment Variables
Create a `.env` file in the **root** directory of the project and populate it with your API keys:

```env
# Backend Keys
FEATHERLESS_API_KEY=your_featherless_api_key
DATABASE_URL=postgresql://postgres.projectref:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=backend/firebase_credentials.json

# Frontend Keys (Firebase config)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```
*(Make sure to download your Firebase Service Account JSON and save it as `backend/firebase_credentials.json`)*

### 3. Start the Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # On Windows
pip install -r requirements.txt
cd ..
python -m backend.main
```
The backend will run on `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.

### 4. Start the Frontend (Vite)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 📦 Deployment Guide

### Deploying the Frontend (Vercel / Netlify)
1. Connect your GitHub repository to Vercel.
2. Set the **Framework Preset** to Vite.
3. Set the **Root Directory** to `frontend`.
4. Copy all your `VITE_` environment variables into Vercel's Environment Variables settings.
5. Click **Deploy**.

### Deploying the Backend (Render / Railway / Heroku)
1. Connect your repository to a service like Render.
2. Create a new **Web Service**.
3. Set the Root Directory to `backend` (or use the root and adjust the command).
4. Build Command: `pip install -r backend/requirements.txt`
5. Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
6. Add your Backend environment variables (including pasting the JSON content of your `firebase_credentials.json` if using a secret manager).
7. Deploy!

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to check [issues page](https://github.com/yourusername/duodo-ai/issues).

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
