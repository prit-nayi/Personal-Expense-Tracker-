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
2. Activate the virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```
3. (Optional) Configure environment variables in `.env` (default is SQLite `sqlite:///./expense_tracker.db`):
   ```env
   DATABASE_URL=sqlite:///./expense_tracker.db
   SECRET_KEY=your_secure_jwt_secret_key
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API Docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

5. Run Automated Tests:
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
