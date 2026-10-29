const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Goal = require('../models/Goal');
const Budget = require('../models/Budget');

const byType = { $group: { _id: '$type', total: { $sum: '$amount' } } };
const totalOf = (agg, type) => agg.find((a) => a._id === type)?.total || 0;

// @route GET /api/dashboard?month=&year=
// month (1-12) and year are optional; they default to the current month.
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const month = req.query.month === undefined ? currentMonth : parseInt(req.query.month, 10);
    const year = req.query.year === undefined ? currentYear : parseInt(req.query.year, 10);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ message: 'month must be 1-12 and year must be between 2000 and 2100' });
    }

    const isCurrentMonth = month === currentMonth && year === currentYear;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const inMonth = { $gte: monthStart, $lt: monthEnd };

    const [accounts, monthlyAgg, afterAgg, allTimeAgg, categoryAgg, recentTransactions, budgets, goals] =
      await Promise.all([
        Account.find({ userId }),
        // income / expense totals inside the selected month
        Transaction.aggregate([{ $match: { userId, date: inMonth } }, byType]),
        // everything that happened AFTER the selected month (used to work out the past balance)
        isCurrentMonth
          ? Promise.resolve([])
          : Transaction.aggregate([{ $match: { userId, date: { $gte: monthEnd } } }, byType]),
        Transaction.aggregate([{ $match: { userId } }, byType]),
        // expenses by category inside the selected month
        Transaction.aggregate([
          { $match: { userId, type: 'expense', date: inMonth } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
          { $sort: { total: -1 } },
        ]),
        Transaction.find({ userId, date: inMonth })
          .sort({ date: -1, createdAt: -1 })
          .limit(8)
          .populate('accountId', 'name'),
        Budget.find({ userId, month, year }),
        Goal.find({ userId }).sort({ createdAt: -1 }).limit(3),
      ]);

    // Balance: today's real balance for the current month. For a past month it is the
    // balance at the END of that month, found by undoing everything recorded after it.
    const currentBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const balance = isCurrentMonth
      ? currentBalance
      : currentBalance - (totalOf(afterAgg, 'income') - totalOf(afterAgg, 'expense'));

    const monthlyIncome = totalOf(monthlyAgg, 'income');
    const monthlyExpense = totalOf(monthlyAgg, 'expense');

    const expensesByCategory = {};
    categoryAgg.forEach((c) => {
      expensesByCategory[c._id] = c.total;
    });

    // Budget summary for the selected month (same rule as the Budgets page:
    // only spending in categories that have a budget counts)
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const budgetCategories = new Set(budgets.map((b) => b.category));
    const totalBudgetSpent = categoryAgg
      .filter((c) => budgetCategories.has(c._id))
      .reduce((s, c) => s + c.total, 0);

    // Savings goals have no history, so they always show current progress
    const goalProgress = goals.map((g) => ({
      name: g.name,
      progress: g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
    }));

    res.json({
      month,
      year,
      isCurrentMonth,
      balance,
      totalIncome: totalOf(allTimeAgg, 'income'),
      totalExpense: totalOf(allTimeAgg, 'expense'),
      monthlyIncome,
      monthlyExpense,
      monthlySavings: monthlyIncome - monthlyExpense,
      savingsRate: monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0,
      expensesByCategory,
      totalBudget,
      totalBudgetSpent,
      goalProgress,
      recentTransactions,
      accounts,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };