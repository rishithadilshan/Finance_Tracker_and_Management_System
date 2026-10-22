const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const getAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).sort({ createdAt: 1 });
    const total = accounts.reduce((sum, a) => sum + a.balance, 0);
    res.json({ accounts, total });
  } catch (err) {
    next(err);
  }
};

const createAccount = async (req, res, next) => {
  try {
    const { name, type, balance } = req.body;
    if (!name) return res.status(400).json({ message: 'Account name is required' });
    const account = await Account.create({
      userId: req.user._id,
      name,
      type,
      balance: balance || 0,
    });
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const { name, type } = req.body;
    if (name !== undefined) account.name = name;
    if (type !== undefined) account.type = type;
    await account.save();
    res.json(account);
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, userId: req.user._id });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const txCount = await Transaction.countDocuments({ accountId: account._id });
    if (txCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete an account that has transactions. Delete its transactions first.',
      });
    }

    await account.deleteOne();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/accounts/transfer
// Moves money between two of the user's own accounts.
// Important: this is NOT recorded as income/expense, since total wealth is unchanged.
const transfer = async (req, res, next) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'fromAccountId, toAccountId and a positive amount are required' });
    }
    if (fromAccountId === toAccountId) {
      return res.status(400).json({ message: 'Cannot transfer to the same account' });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, userId: req.user._id });
    const toAccount = await Account.findOne({ _id: toAccountId, userId: req.user._id });
    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: 'One or both accounts not found' });
    }
    if (fromAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance in source account' });
    }

    fromAccount.balance -= amount;
    toAccount.balance += amount;
    await fromAccount.save();
    await toAccount.save();

    res.json({ fromAccount, toAccount });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAccounts, createAccount, updateAccount, deleteAccount, transfer };
