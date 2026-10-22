const Transaction = require('../models/Transaction');

const summarize = async (userId, startDate, endDate) => {
  const [totals, byCategory, byType] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const totalIncome = totals.find((t) => t._id === 'income')?.total || 0;
  const totalExpense = totals.find((t) => t._id === 'expense')?.total || 0;

  return {
    totalIncome,
    totalExpense,
    totalSavings: totalIncome - totalExpense,
    expensesByCategory: byCategory.map((c) => ({ category: c._id, total: c.total })),
    highestExpenseCategory: byCategory[0] ? { category: byCategory[0]._id, total: byCategory[0].total } : null,
    breakdown: byType.map((b) => ({ type: b._id.type, category: b._id.category, total: b.total })),
  };
};

// @route GET /api/reports/monthly?month=&year=
const monthlyReport = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const summary = await summarize(req.user._id, startDate, endDate);
    res.json({ month, year, ...summary });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/reports/yearly?year=
const yearlyReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);

    const monthly = await Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: monthly.find((m) => m._id.month === i + 1 && m._id.type === 'income')?.total || 0,
      expense: monthly.find((m) => m._id.month === i + 1 && m._id.type === 'expense')?.total || 0,
    }));

    const summary = await summarize(req.user._id, startDate, endDate);
    res.json({ year, months, ...summary });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/reports/category?category=&startDate=&endDate=
const categoryReport = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;
    if (!category) return res.status(400).json({ message: 'category is required' });

    const filter = { userId: req.user._id, category };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    const total = transactions.reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);

    res.json({ category, total, count: transactions.length, transactions });
  } catch (err) {
    next(err);
  }
};

module.exports = { monthlyReport, yearlyReport, categoryReport };
