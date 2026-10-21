const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

const applyBalanceChange = async (accountId, type, amount, sign = 1) => {
  const account = await Account.findById(accountId);
  if (!account) throw new Error('Account not found');
  const delta = type === 'income' ? amount : -amount;
  account.balance += delta * sign;
  await account.save();
};

// @route POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const { accountId, type, amount, category, description, date, paymentMethod } = req.body;

    if (!accountId || !type || !amount || !category) {
      return res.status(400).json({ message: 'accountId, type, amount and category are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'type must be income or expense' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'amount must be greater than 0' });
    }

    const account = await Account.findOne({ _id: accountId, userId: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const transaction = await Transaction.create({
      userId: req.user._id,
      accountId,
      type,
      amount,
      category,
      description,
      date: date || Date.now(),
      paymentMethod,
    });

    await applyBalanceChange(accountId, type, amount, 1);

    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
};

// @route GET /api/transactions?type=&category=&startDate=&endDate=&search=&accountId=&page=&limit=&sort=
const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search, accountId, page = 1, limit = 20, sort = '-date' } = req.query;

    const filter = { userId: req.user._id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (accountId) filter.accountId = accountId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .populate('accountId', 'name type')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id }).populate(
      'accountId',
      'name type'
    );
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Reverse the old effect on the account balance first
    await applyBalanceChange(transaction.accountId, transaction.type, transaction.amount, -1);

    const { accountId, type, amount, category, description, date, paymentMethod } = req.body;
    if (accountId !== undefined) transaction.accountId = accountId;
    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;

    await transaction.save();

    // Apply the new effect
    await applyBalanceChange(transaction.accountId, transaction.type, transaction.amount, 1);

    res.json(transaction);
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    await applyBalanceChange(transaction.accountId, transaction.type, transaction.amount, -1);
    await transaction.deleteOne();

    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
