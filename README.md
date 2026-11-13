# Personal Expense Tracker & Intelligence Platform (MVP)

A modern, responsive, and secure personal finance application built with **FastAPI**, **PostgreSQL/SQLite**, and **React + TypeScript + Tailwind CSS**.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** installed
- **Node.js 18+** & **npm** installed

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```
4. Configure environment variables by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

6. Run Automated Tests:
   ```bash
   pytest -v
   ```

---

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Run the Vite development server:
   ```bash
   npm run dev
   ```
   - Frontend available at: [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deployment Guide

### 1. Database (Neon PostgreSQL)
1. Create a project in [Neon](https://neon.tech).
2. Copy the **pooled** connection string (ending in `-pooler.postgres.neon.tech`).
3. Set `DATABASE_URL` in your backend environment variables with that pooled connection string.

### 2. Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com) connected to your repository.
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers`
5. Environment Variables:
   - `PYTHON_VERSION`: `3.12.8`
   - `DATABASE_URL`: Your Neon pooled connection string.
   - `SECRET_KEY`: A strong random secret key.
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend.vercel.app"]`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
   - `AUTO_CREATE_TABLES`: `true`
6. (Optional) Set up a keep-alive monitor (e.g. cron-job.org) to ping `https://your-backend.onrender.com/health/db` every 10 minutes to prevent Neon and Render sleep.

### 3. Frontend (Vercel)
1. Import repository into [Vercel](https://vercel.com).
2. Root Directory: `frontend`
3. Framework Preset: `Vite`
4. Environment Variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api/v1`
5. Deploy. SPA rewrites are handled automatically via `vercel.json`.

---

## 🌟 MVP Feature Overview
- **Authentication**: Secure registration, JWT token login, profile isolation, and password hashing (bcrypt).
- **Accounts**: Multi-account tracking (Checking, Cash, Savings, Credit Card, Wallet) with automatic real-time balance calculations.
- **Transactions**: Full CRUD for Income, Expense, and Transfers with atomic database operations and account balance synchronization.
- **Filters & Search**: Multi-field search by description/tags, date range, account, category, and type.
- **Budgets**: Monthly category spending limits with real-time utilization progress bars and threshold warning alerts (80%, 100%).
- **Interactive Analytics**: Dashboard summary cards, Category spending donut chart, 6-month historical income vs expense trends (Recharts).
- **Data Export**: Export transaction records to CSV format.
- **Responsive Design**: WCAG 2.2 AA compliant UI tailored for desktop and mobile devices.

  ## FREE HOSTED ON
  - **Database** :- Postgres sql          **HOSTED** on Neon
  - **backend**  :- FastApi                **HOSTED** on Render
  - **Frontend** :- React + TypeScript    **HOSTED** on Vercel   
