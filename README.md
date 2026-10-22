# Personal Finance Tracker (MERN)

A full-stack personal financial tracker built with MongoDB, Express, React and Node.js.

## What's included

**Backend (Node.js + Express + MongoDB + JWT)**
- User auth (register/login, JWT, password hashing with bcrypt)
- Accounts (cash/bank/savings/credit card/wallet) with balance tracking
- Transactions (income & expense) with full CRUD, search, filters, pagination
- Account-to-account transfers (correctly excluded from income/expense totals)
- Budgets per category per month, with spent/remaining/percentage-used calculations
- Savings goals with progress %, contributions, and required-monthly-saving calculation
- Dashboard API aggregating balance, monthly income/expense, category breakdown, budget status, goal progress, recent transactions
- Reports API: monthly, yearly (12-month income vs expense), and per-category

**Frontend (React + Vite + Tailwind + Recharts)**
- The page screens and their routes have been removed; the frontend currently renders no page content.

## Project structure

```
finance-tracker/
├── backend/
│   ├── config/db.js
│   ├── models/            (User, Account, Transaction, Budget, Goal, RecurringTransaction)
│   ├── controllers/
│   ├── routes/
│   ├── middleware/         (JWT auth, error handling)
│   ├── app.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        └── components/     (Navbar, PrivateRoute, StatCard, ProgressBar)
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm install
npm run dev        # nodemon, or `npm start` for plain node
```

The API runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # optional — Vite proxy already forwards /api to :5000
npm install
npm run dev
```

The app runs on `http://localhost:5173`. Register a new account, and a default "Cash" account is created for you automatically so you can start adding transactions right away.

## How it works (quick tour)

1. **Register/Login** → JWT stored in `localStorage`, attached to every API request via an axios interceptor.
2. **Add an account** (or use the default Cash one) → **Add transactions** (income/expense) against that account → the account balance updates automatically.
3. **Set budgets** per category per month → the Budgets page shows spent vs. budget with warning (⚠️ ≥80%) / exceeded (🔴 ≥100%) states.
4. **Create savings goals** and contribute to them over time → progress bar + required monthly saving to hit your target date.
5. **Transfers** between your own accounts move money without being counted as income/expense — the total balance stays the same, only its distribution changes.
6. **Dashboard** and **Reports** pull everything together via MongoDB aggregation pipelines (no client-side recalculation of totals).

## Extending it

This covers the "core" module list (auth, dashboard, transactions, accounts, budgets, goals, reports/analytics). Natural next additions, following the same patterns already in the codebase:
- **Recurring transactions**: the `RecurringTransaction` model is already scaffolded — add a route/controller plus a small cron job (e.g. `node-cron`) that checks `nextDate <= today` and auto-creates transactions.
- **Bill reminders**: similar shape to recurring transactions, but without auto-creating a transaction — just a due-date list + notification.
- **Notifications**: the budget/goal endpoints already compute the numbers needed (percentageUsed, remaining) — a notifications page can just poll those and render alerts.
- **CSV/PDF export**: add a `/api/reports/export` endpoint using a library like `json2csv` or `pdfkit`, reusing the existing report aggregation logic.
- **Expense prediction (optional ML)**: the yearly report already returns 12 months of income/expense — a simple moving-average or linear regression over that array is enough for a first version; no ML framework required.
