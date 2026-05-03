# 💸 ExpenseIQ — Smart Expense Tracker with AI Insights

> A production-grade, full-stack SaaS application for intelligent personal finance tracking powered by Google Gemini AI.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## ✨ Features

- **Authentication** — Firebase Auth (Google OAuth + email/password); JWT sent to API per request
- **Expense Management** — Add, edit, delete expenses with category validation and pagination (per-user data)
- **Rich Dashboard** — Real-time spending stats, pie charts, bar charts, and trend data
- **AI Financial Insights** — Powered by Google Gemini 1.5 Flash with structured prompt engineering
  - Spending pattern analysis with exact ₹ amounts
  - Overspending detection per category
  - Budget allocation recommendations (50/30/20 adapted)
  - Financial health score (0–100)
  - Actionable recommendations with estimated monthly savings
- **Production-Ready Backend** — MVC architecture, Joi validation, centralized error handling, Winston logging, rate limiting
- **Responsive UI** — Dark-themed, mobile-first design built with Tailwind CSS

---

## 🏗️ Architecture

```
smart-expense-tracker/
├── backend/                    # Node.js + Express API
│   └── src/
│       ├── controllers/        # Request handlers
│       ├── services/           # Business logic + AI service
│       ├── models/             # Mongoose schemas
│       ├── routes/             # Express routes
│       ├── middleware/         # Error handler, validation
│       ├── validators/         # Joi validation schemas
│       ├── utils/              # AppError, logger, response helpers
│       └── config/             # DB connection
└── frontend/                   # React + Vite + Tailwind
    └── src/
        ├── components/
        │   ├── ui/             # Reusable UI components + forms
        │   └── layout/         # App shell + sidebar
        ├── pages/              # Dashboard, Expenses, Insights
        ├── hooks/              # Custom React hooks
        ├── services/           # Axios API client
        └── utils/              # Formatters, helpers
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- **Firebase** project with Authentication enabled (Google + Email/Password)
- Google Gemini API key for AI insights ([get one free](https://aistudio.google.com/app/apikey)) — optional; fallback insights work without it

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/smart-expense-tracker.git
cd smart-expense-tracker

# Install all dependencies (root + backend + frontend)
npm install
npm run install:all
```

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/expenseDB
# Firebase Admin — service account JSON as one line (see Firebase setup below)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Copy from `backend/.env.example` and `frontend/.env.example`, then fill in real values.

### Firebase setup

1. In [Firebase Console](https://console.firebase.google.com), create a project (or use an existing one).
2. **Authentication** → Sign-in method: enable **Google** and **Email/Password**.
3. **Project settings** → Your apps → Add **Web** app → copy the `firebaseConfig` values into `frontend/.env` as `VITE_FIREBASE_*`.
4. **Project settings** → **Service accounts** → **Generate new private key** → download the JSON file.
5. Set backend env (pick one):
   - **Recommended (hosted):** minify JSON to one line and set `FIREBASE_SERVICE_ACCOUNT_JSON` in `backend/.env`:
     ```bash
     export FIREBASE_SERVICE_ACCOUNT_JSON="$(cat path/to/serviceAccount.json | jq -c .)"
     ```
   - **Local file:** set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json` and leave `FIREBASE_SERVICE_ACCOUNT_JSON` empty.
6. Add your frontend URL to **Authentication** → **Settings** → **Authorized domains** (e.g. `localhost`, production domain).

All `/api/expenses` and `/api/insights` requests require header: `Authorization: Bearer <Firebase ID token>` (the app does this automatically after login).

### 3. Run Development Servers

```bash
# Single command from repo root
npm run dev

# OR run separately:
# Terminal 1 — Backend
cd backend && npm run dev
# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` — you will be redirected to **Login** until you sign in.

**Note:** Expenses created before multi-user support had no `userId` in MongoDB; they will not appear for any account. New data is isolated per Firebase `uid`.

---

## 📡 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Expense Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/expenses` | Get paginated expenses |
| `POST` | `/expenses` | Create expense |
| `GET` | `/expenses/:id` | Get expense by ID |
| `PUT` | `/expenses/:id` | Update expense |
| `DELETE` | `/expenses/:id` | Delete expense |
| `GET` | `/expenses/dashboard` | Dashboard aggregated data |
| `GET` | `/expenses/categories` | List all categories |

**Query params for GET /expenses:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `category` (optional, must be valid enum)
- `startDate` / `endDate` (optional, ISO date)
- `sortBy` (date | amount | category | createdAt)
- `sortOrder` (asc | desc)

### Insights Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/insights?months=3` | Generate AI insights |

**Query params:**
- `months` (1–12, default: 3) — Analysis period

### Response Format

All responses follow this structure:
```json
{
  "status": "success" | "error",
  "message": "Human-readable message",
  "data": { ... }
}
```

---

## 🌐 Deployment

### Backend → Render

1. Push backend to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Root Directory**: `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add environment variables in the Render dashboard
7. Deploy ✅

### Frontend → Vercel

1. Push frontend to GitHub
2. Import repo on [Vercel](https://vercel.com)
3. Set **Root Directory**: `frontend`
4. Set framework: **Vite**
5. Add environment variable: `VITE_API_BASE_URL=https://your-render-url.onrender.com/api`
6. Deploy ✅

> **CORS**: Make sure `FRONTEND_URL` in backend env points to your Vercel URL.

---

## 🛡️ Security Features

- Helmet.js HTTP headers
- Rate limiting (100 req / 15 min)
- Input sanitization via Joi
- Request size limits (10kb)
- No raw data sent to AI (aggregated summaries only)

---

## 🤖 AI Prompt Engineering

The AI analysis follows a structured pipeline:

1. **MongoDB Aggregation** — Category totals, monthly trends, transaction counts
2. **Structured Summary** — Only pre-aggregated data sent to AI (no raw records)
3. **Prompt Engineering** — Financial advisor persona with ideal budget ratios
4. **JSON Output** — Structured response: score, insights, recommendations, budget allocation
5. **Retry Logic** — Up to 2 retries on API failures

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| Validation | Joi |
| Logging | Winston |
| HTTP | Axios |
| Routing | React Router v6 |
| Notifications | React Hot Toast |

---

## 📄 License

MIT © 2025
