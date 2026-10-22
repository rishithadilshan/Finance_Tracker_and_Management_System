const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @route GET /api/budgets?month=&year=
const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({ userId: req.user._id, month, year });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const results = await Promise.all(
      budgets.map(async (b) => {
        const agg = await Transaction.aggregate([
          {
            $match: {
              userId: req.user._id,
              type: 'expense',
              category: b.category,
              date: { $gte: startDate, $lt: endDate },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const spent = agg[0]?.total || 0;
        const remaining = b.amount - spent;
        const percentageUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

        return {
          _id: b._id,
          category: b.category,
          amount: b.amount,
          month: b.month,
          year: b.year,
          spent,
          remaining,
          percentageUsed,
          status: percentageUsed >= 100 ? 'exceeded' : percentageUsed >= 80 ? 'warning' : 'ok',
        };
      })
    );

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = results.reduce((s, b) => s + b.spent, 0);

    res.json({
      month,
      year,
      budgets: results,
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/budgets
const createOrUpdateBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;
    if (!category || amount === undefined || !month || !year) {
      return res.status(400).json({ message: 'category, amount, month and year are required' });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, category, month, year },
      { $set: { amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    await budget.deleteOne();
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBudgets, createOrUpdateBudget, deleteBudget };
