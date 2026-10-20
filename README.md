# Finance_Tracker_and_Management_System
Personal Financial Tracker is a web-based application designed to help users manage and monitor their personal finances. The system allows users to record income and expenses, manage budgets, track savings goals, and monitor their financial accounts.
## Overview

Most expense trackers only record what you spent. **FinTrack** goes further by connecting the whole financial flow:

```
Income → Expenses → Budget → Savings → Goals → Analysis → Reports
```

Each user has a private account; every API request is authenticated with JWT so one user can never see another user's financial data.

---

## Features

### Authentication & Profile
- Register / login with hashed passwords (bcrypt)
- JWT-based protected routes
- Profile update, currency selection, change password

### Dashboard
- Total balance across all accounts
- Monthly income, expenses and savings (with savings rate)
- Expenses-by-category pie chart
- Monthly budget progress with warning / exceeded alerts
- Savings goal progress
- Recent transactions

### Transactions
- Add, edit, delete income and expense records
- Search by description or category
- Filter by type, category, account and date range
- Server-side pagination and sorting
- Account balances update automatically

### Multiple Accounts & Transfers
- Cash, bank, savings, credit card, digital wallet
- Transfer money between accounts — **not** counted as income or expense

### Budgets
- Set a monthly budget per category
- Spent / remaining / percentage used calculated server-side
- ⚠️ Warning at 80% and 🔴 exceeded state at 100%

### Savings Goals
- Create goals with a target amount and optional target date
- Contribute over time and track progress
- Automatic "required monthly saving" calculation

### Reports & Analytics
- Monthly report (income, expenses, savings, highest expense category)
- Yearly report with income vs. expense bar chart
- Category report

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router, Axios, Tailwind CSS, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JSON Web Tokens (JWT), bcryptjs |
| **Tools** | Git & GitHub, Postman, VS Code, nodemon |

---

## 🏗 System Architecture

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

The frontend never talks to MongoDB directly — everything goes through the authenticated Express API.

---

## 📂 Project Structure

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
