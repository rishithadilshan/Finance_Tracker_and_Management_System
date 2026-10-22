const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'finance_tracker_demo_secret';

app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'demo123',
    currency: 'USD',
  },
];

const accounts = [
  { _id: 'acc_1', name: 'Savings', type: 'savings', balance: 5200, currency: 'USD' },
  { _id: 'acc_2', name: 'Checking', type: 'checking', balance: 2300, currency: 'USD' },
  { _id: 'acc_3', name: 'Credit Card', type: 'credit', balance: -420, currency: 'USD' },
];

const transactions = [
  {
    _id: 'txn_1',
    description: 'Salary Deposit',
    amount: 4000,
    type: 'income',
    category: 'Salary',
    accountId: { _id: 'acc_1', name: 'Savings' },
    date: '2026-10-10T10:00:00.000Z',
  },
  {
    _id: 'txn_2',
    description: 'Rent Payment',
    amount: 1200,
    type: 'expense',
    category: 'Housing',
    accountId: { _id: 'acc_2', name: 'Checking' },
    date: '2026-10-11T12:00:00.000Z',
  },
  {
    _id: 'txn_3',
    description: 'Groceries',
    amount: 280,
    type: 'expense',
    category: 'Food',
    accountId: { _id: 'acc_2', name: 'Checking' },
    date: '2026-10-15T08:20:00.000Z',
  },
  {
    _id: 'txn_4',
    description: 'Freelance Project',
    amount: 850,
    type: 'income',
    category: 'Freelance',
    accountId: { _id: 'acc_1', name: 'Savings' },
    date: '2026-10-19T14:00:00.000Z',
  },
];

const budgets = [
  { _id: 'bud_1', category: 'Housing', limit: 1500, spent: 1200 },
  { _id: 'bud_2', category: 'Food', limit: 600, spent: 280 },
  { _id: 'bud_3', category: 'Transport', limit: 250, spent: 110 },
];

const goals = [
  { _id: 'goal_1', name: 'Emergency Fund', target: 10000, saved: 6200 },
  { _id: 'goal_2', name: 'Vacation', target: 3500, saved: 1800 },
];

const buildToken = (user) => jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

const getUserByEmail = (email) => users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = users.find((user) => user.id === decoded.id) || null;
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const baseSummary = () => {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const totalBudget = budgets.reduce((sum, item) => sum + Number(item.limit), 0);
  const totalBudgetSpent = budgets.reduce((sum, item) => sum + Number(item.spent), 0);
  const savingsRate = totalBudget > 0 ? Math.round((income - expense) / income * 100) : 0;

  return {
    balance,
    monthlyIncome: income,
    monthlyExpense: expense,
    monthlySavings: income - expense,
    savingsRate,
    totalBudget,
    totalBudgetSpent,
    expensesByCategory: transactions
      .filter((t) => t.type === 'expense')
      .reduce((obj, item) => {
        obj[item.category] = (obj[item.category] || 0) + Number(item.amount);
        return obj;
      }, {}),
    goalProgress: goals.map((goal) => ({
      name: goal.name,
      progress: Math.min(100, Math.round((goal.saved / goal.target) * 100)),
    })),
    recentTransactions: transactions.slice(0, 5),
  };
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Finance Tracker API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Finance Tracker API is running' });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = buildToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  return app._router.handle(req, res);
});

app.post('/auth/register', (req, res) => {
  const { name, email, password, currency } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (getUserByEmail(email)) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const user = {
    id: Date.now(),
    name,
    email,
    password,
    currency: currency || 'USD',
  };

  users.push(user);
  const token = buildToken(user);

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  return app._router.handle(req, res);
});

app.get('/auth/me', authMiddleware, (req, res) => {
  return res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, currency: req.user.currency } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  return res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, currency: req.user.currency } });
});

app.get('/dashboard', authMiddleware, (req, res) => {
  return res.json(baseSummary());
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  return res.json(baseSummary());
});

app.get('/transactions', authMiddleware, (req, res) => {
  return res.json(transactions);
});

app.get('/api/transactions', authMiddleware, (req, res) => {
  return res.json(transactions);
});

app.post('/transactions', authMiddleware, (req, res) => {
  const newTransaction = {
    _id: `txn_${Date.now()}`,
    ...req.body,
    accountId: req.body.accountId || { _id: 'acc_2', name: 'Checking' },
  };
  transactions.unshift(newTransaction);
  return res.status(201).json(newTransaction);
});

app.post('/api/transactions', authMiddleware, (req, res) => {
  return app._router.handle(req, res);
});

app.get('/accounts', authMiddleware, (req, res) => {
  return res.json(accounts);
});

app.get('/api/accounts', authMiddleware, (req, res) => {
  return res.json(accounts);
});

app.post('/accounts', authMiddleware, (req, res) => {
  const newAccount = {
    _id: `acc_${Date.now()}`,
    ...req.body,
  };
  accounts.push(newAccount);
  return res.status(201).json(newAccount);
});

app.post('/api/accounts', authMiddleware, (req, res) => {
  return app._router.handle(req, res);
});

app.get('/budgets', authMiddleware, (req, res) => {
  return res.json(budgets);
});

app.get('/api/budgets', authMiddleware, (req, res) => {
  return res.json(budgets);
});

app.post('/budgets', authMiddleware, (req, res) => {
  const newBudget = {
    _id: `bud_${Date.now()}`,
    ...req.body,
  };
  budgets.push(newBudget);
  return res.status(201).json(newBudget);
});

app.post('/api/budgets', authMiddleware, (req, res) => {
  return app._router.handle(req, res);
});

app.get('/goals', authMiddleware, (req, res) => {
  return res.json(goals);
});

app.get('/api/goals', authMiddleware, (req, res) => {
  return res.json(goals);
});

app.post('/goals', authMiddleware, (req, res) => {
  const newGoal = {
    _id: `goal_${Date.now()}`,
    ...req.body,
  };
  goals.push(newGoal);
  return res.status(201).json(newGoal);
});

app.post('/api/goals', authMiddleware, (req, res) => {
  return app._router.handle(req, res);
});

app.get('/reports', authMiddleware, (req, res) => {
  const summary = baseSummary();
  return res.json({
    income: summary.monthlyIncome,
    expense: summary.monthlyExpense,
    savings: summary.monthlySavings,
    balance: summary.balance,
    expensesByCategory: summary.expensesByCategory,
  });
});

app.get('/api/reports', authMiddleware, (req, res) => {
  const summary = baseSummary();
  return res.json({
    income: summary.monthlyIncome,
    expense: summary.monthlyExpense,
    savings: summary.monthlySavings,
    balance: summary.balance,
    expensesByCategory: summary.expensesByCategory,
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Finance Tracker API running on http://localhost:${PORT}`);
});
