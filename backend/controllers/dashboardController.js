const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const Budget = require('../models/Budget');

// @route GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const accounts = await Account.find({ userId });
    const balance = accounts.reduce((s, a) => s + a.balance, 0);

    const [monthlyAgg, allTimeAgg, categoryAgg, recentTransactions] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Transaction.find({ userId }).sort({ date: -1 }).limit(8).populate('accountId', 'name'),
    ]);

    const monthlyIncome = monthlyAgg.find((a) => a._id === 'income')?.total || 0;
    const monthlyExpense = monthlyAgg.find((a) => a._id === 'expense')?.total || 0;
    const totalIncome = allTimeAgg.find((a) => a._id === 'income')?.total || 0;
    const totalExpense = allTimeAgg.find((a) => a._id === 'expense')?.total || 0;

    const expensesByCategory = {};
    categoryAgg.forEach((c) => {
      expensesByCategory[c._id] = c.total;
    });

    // Budget status summary for the current month
    const budgets = await Budget.find({ userId, month: now.getMonth() + 1, year: now.getFullYear() });
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);

    // Savings goal progress (top 3 by progress remaining)
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 }).limit(3);
    const goalProgress = goals.map((g) => ({
      name: g.name,
      progress: g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
    }));

    res.json({
      balance,
      totalIncome,
      totalExpense,
      monthlyIncome,
      monthlyExpense,
      monthlySavings: monthlyIncome - monthlyExpense,
      savingsRate: monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0,
      expensesByCategory,
      totalBudget,
      totalBudgetSpent: monthlyExpense,
      goalProgress,
      recentTransactions,
      accounts,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
