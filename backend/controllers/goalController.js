const Goal = require('../models/Goal');

const decorate = (goal) => {
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const progress = goal.targetAmount > 0 ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100) : 0;

  let requiredMonthlySaving = null;
  if (goal.targetDate) {
    const now = new Date();
    const months = Math.max(
      (goal.targetDate.getFullYear() - now.getFullYear()) * 12 + (goal.targetDate.getMonth() - now.getMonth()),
      1
    );
    requiredMonthlySaving = Math.ceil(remaining / months);
  }

  return {
    _id: goal._id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    targetDate: goal.targetDate,
    remaining,
    progress,
    requiredMonthlySaving,
  };
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(goals.map(decorate));
  } catch (err) {
    next(err);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount, targetDate } = req.body;
    if (!name || !targetAmount) {
      return res.status(400).json({ message: 'name and targetAmount are required' });
    }
    const goal = await Goal.create({
      userId: req.user._id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      targetDate,
    });
    res.status(201).json(decorate(goal));
  } catch (err) {
    next(err);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { name, targetAmount, currentAmount, targetDate } = req.body;
    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (targetDate !== undefined) goal.targetDate = targetDate;

    await goal.save();
    res.json(decorate(goal));
  } catch (err) {
    next(err);
  }
};

// @route POST /api/goals/:id/contribute  { amount }
const contributeToGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'amount must be positive' });

    goal.currentAmount += amount;
    await goal.save();
    res.json(decorate(goal));
  } catch (err) {
    next(err);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    await goal.deleteOne();
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGoals, createGoal, updateGoal, contributeToGoal, deleteGoal };
