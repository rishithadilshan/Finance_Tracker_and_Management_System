import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const fmt = (currency) => (n) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(
    n || 0
  );

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const money = fmt(user?.currency);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard'));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div className="text-gray-500">Loading dashboard...</div>;

  const pieData = Object.entries(data.expensesByCategory || {}).map(([name, value]) => ({ name, value }));
  const budgetPercent = data.totalBudget > 0 ? Math.round((data.totalBudgetSpent / data.totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Balance" value={money(data.balance)} accent="text-brand-700" />
        <StatCard label="This Month Income" value={money(data.monthlyIncome)} accent="text-sky-600" />
        <StatCard label="This Month Expense" value={money(data.monthlyExpense)} accent="text-red-500" />
        <StatCard
          label="This Month Savings"
          value={money(data.monthlySavings)}
          accent="text-emerald-600"
          sub={`Savings rate: ${data.savingsRate}%`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Expenses by Category (this month)</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400">No expenses recorded yet this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">Monthly Budget</span>
              <span className="text-gray-500">
                {money(data.totalBudgetSpent)} / {money(data.totalBudget)}
              </span>
            </div>
            <ProgressBar percent={budgetPercent} color={budgetPercent >= 100 ? 'bg-red-500' : budgetPercent >= 80 ? 'bg-amber-500' : 'bg-brand-500'} />
            {budgetPercent >= 100 && <p className="text-xs text-red-500 mt-1">🔴 You've exceeded your monthly budget.</p>}
            {budgetPercent >= 80 && budgetPercent < 100 && (
              <p className="text-xs text-amber-600 mt-1">⚠️ You've used {budgetPercent}% of your monthly budget.</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Savings Goals</h3>
            {data.goalProgress.length === 0 ? (
              <p className="text-sm text-gray-400">No savings goals yet.</p>
            ) : (
              <div className="space-y-3">
                {data.goalProgress.map((g, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{g.name}</span>
                      <span className="text-gray-500">{g.progress}%</span>
                    </div>
                    <ProgressBar percent={g.progress} color="bg-sky-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Recent Transactions</h2>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-400">No transactions yet.</p>
        ) : (
          <div className="divide-y">
            {data.recentTransactions.map((t) => (
              <div key={t._id} className="flex justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{t.description || t.category}</div>
                  <div className="text-xs text-gray-400">
                    {t.category} · {t.accountId?.name} · {new Date(t.date).toLocaleDateString()}
                  </div>
                </div>
                <div className={t.type === 'income' ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                  {t.type === 'income' ? '+' : '-'}
                  {money(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
