# Personal Finance Tracker (MERN)

A full-stack personal financial tracker built with MongoDB, Express, React and Node.js.

## What's included

## Features
```
Authentication & Profile
    Register / login with hashed passwords (bcrypt)
    JWT-based protected routes
    Profile update, currency selection, change password

Dashboard
    Total balance across all accounts
    Monthly income, expenses and savings (with savings rate)
    Expenses-by-category pie chart
    Monthly budget progress with warning / exceeded alerts
    Savings goal progress
    Recent transactions

Transactions
    Add, edit, delete income and expense records
    Search by description or category
    Filter by type, category, account and date range
    Server-side pagination and sorting
    Account balances update automatically
    Multiple Accounts & Transfers
    Cash, bank, savings, credit card, digital wallet
    Transfer money between accounts — not counted as income or expense

Budgets
    Set a monthly budget per category
    Spent / remaining / percentage used calculated server-side
    ⚠️ Warning at 80% and 🔴 exceeded state at 100%

Savings Goals
    Create goals with a target amount and optional target date
    Contribute over time and track progress
    Automatic "required monthly saving" calculation

Reports & Analytics
    Monthly report (income, expenses, savings, highest expense category)
    Yearly report with income vs. expense bar chart
    Category report
```

## Project structure
```
finance-tracker/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/               # Request handling & business logic
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── transactionController.js
│   │   ├── budgetController.js
│   │   ├── goalController.js
│   │   ├── dashboardController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   └── errorMiddleware.js
│   ├── models/                    # Mongoose schemas
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Transaction.js
│   │   ├── Budget.js
│   │   ├── Goal.js
│   │   └── RecurringTransaction.js
│   ├── routes/
│   ├── app.js
│   ├── server.js
│   └── .env.example
│
└── frontend/
    └── src/
        ├── api/axios.js           # Axios instance + auth interceptor
        ├── context/AuthContext.jsx
        ├── components/            # Navbar, PrivateRoute, StatCard, ProgressBar
        ├── pages/                 # Login, Register, Dashboard, Transactions,
        │                          # Accounts, Budgets, Goals, Reports
        ├── App.jsx
        └── main.jsx 
```
## System Architecture
```
                 FRONTEND
          React + Vite + Tailwind
                    │
              HTTP (REST / JSON)
                    │
                    ▼
               BACKEND API
              Express.js (Node)
                    │
     ┌──────────────┼──────────────┐
     │              │              │
 Auth (JWT)    Business Logic   Validation
     │              │              │
     └──────────────┼──────────────┘
                    │
                    ▼
                 MongoDB
```

## Database Models
```
User                 Account              Transaction
├─ name              ├─ userId            ├─ userId
├─ email (unique)    ├─ name              ├─ accountId
├─ password (hash)   ├─ type              ├─ type (income | expense)
├─ currency          └─ balance           ├─ amount
└─ monthlyIncomeTarget                    ├─ category
                                          ├─ description
Budget               Goal                 ├─ date
├─ userId            ├─ userId            └─ paymentMethod
├─ category          ├─ name
├─ amount            ├─ targetAmount
├─ month             ├─ currentAmount
└─ year              └─ targetDate
```


# Key Business Logic

Balance integrity — creating, editing or deleting a transaction reverses and re-applies its effect on the account balance, so balances never drift.
Transfers are not expenses — moving money between your own accounts changes how wealth is distributed, not the total.
Server-side aggregation — dashboard and report totals are computed with MongoDB aggregation pipelines, not in the browser.
Data isolation — every query is scoped by the authenticated userId.
Budget status — ok (< 80%), warning (≥ 80%), exceeded (≥ 100%).

## Setup

### Prerequisites
- Node.js 18.11+
- MongoDB running locally, or a MongoDB Atlas connection string

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a real JWT_SECRET
npm install
npm run dev        # Node's built-in watch mode, or `npm start` for plain node
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
