import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString('default', { month: 'long' }));
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - i); // this year and the 10 before it

const fmt = (currency) => (n) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(
    n || 0
  );

const Dashboard = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const money = fmt(user?.currency);

  const isCurrent = month === CURRENT_MONTH && year === CURRENT_YEAR;
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const shortLabel = isCurrent ? 'This Month' : `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`;

  // Load the dashboard whenever the selected month or year changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/dashboard', { params: { month, year } })
      .then((res) => {
        if (cancelled) return;
        // The updated backend echoes back the month and year it used. If they are
        // missing or different, the server is still running the old controller.
        if (res.data.month !== month || res.data.year !== year) {
          setError(
            'The server did not return data for this month. Restart the backend (npm run dev in the backend folder) so it uses the updated dashboardController.js.'
          );
          return;
        }
        setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, year]);

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (isCurrent) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToCurrent = () => {
    setMonth(CURRENT_MONTH);
    setYear(CURRENT_YEAR);
  };

  const handleYearChange = (y) => {
    setYear(y);
    // do not allow a month in the future
    if (y === CURRENT_YEAR && month > CURRENT_MONTH) setMonth(CURRENT_MONTH);
  };

  if (!data && error) return <div className="text-red-600">{error}</div>;
  if (!data) return <div className="text-gray-500">Loading dashboard...</div>;

  const pieData = Object.entries(data.expensesByCategory || {}).map(([name, value]) => ({ name, value }));
  const budgetPercent = data.totalBudget > 0 ? Math.round((data.totalBudgetSpent / data.totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>

        {/* Month switcher */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={goPrev}
            aria-label="Previous month"
            className="w-9 h-9 rounded-md border bg-white hover:bg-gray-100 text-lg leading-none"
          >
            ‹
          </button>

          <select
            aria-label="Month"
            className="border rounded-md px-2 h-9 bg-white"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1} disabled={year === CURRENT_YEAR && i + 1 > CURRENT_MONTH}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="Year"
            className="border rounded-md px-2 h-9 bg-white"
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={goNext}
            disabled={isCurrent}
            aria-label="Next month"
            className="w-9 h-9 rounded-md border bg-white hover:bg-gray-100 text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            ›
          </button>

          {!isCurrent && (
            <button onClick={goToCurrent} className="px-3 h-9 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700">
              This month
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</div>}

      <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        {!isCurrent && (
          <div className="bg-sky-50 border border-sky-200 text-sky-800 text-sm rounded-lg px-3 py-2">
            You are viewing <span className="font-semibold">{periodLabel}</span>.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Balance"
            value={money(data.balance)}
            accent="text-brand-700"
            sub={isCurrent ? undefined : `At the end of ${periodLabel}`}
          />
          <StatCard label={`${shortLabel} Income`} value={money(data.monthlyIncome)} accent="text-sky-600" />
          <StatCard label={`${shortLabel} Expense`} value={money(data.monthlyExpense)} accent="text-red-500" />
          <StatCard
            label={`${shortLabel} Savings`}
            value={money(data.monthlySavings)}
            accent="text-emerald-600"
            sub={`Savings rate: ${data.savingsRate}%`}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Expenses by Category ({isCurrent ? 'this month' : periodLabel})</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-400">
                {isCurrent ? 'No expenses recorded yet this month.' : `No expenses recorded in ${periodLabel}.`}
              </p>
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
                {data.totalBudget > 0 && (
                  <span className="text-gray-500">
                    {money(data.totalBudgetSpent)} / {money(data.totalBudget)}
                  </span>
                )}
              </div>
              {data.totalBudget > 0 ? (
                <>
                  <ProgressBar
                    percent={budgetPercent}
                    color={budgetPercent >= 100 ? 'bg-red-500' : budgetPercent >= 80 ? 'bg-amber-500' : 'bg-brand-500'}
                  />
                  {budgetPercent >= 100 && (
                    <p className="text-xs text-red-500 mt-1">
                      🔴 {isCurrent ? "You've exceeded your monthly budget." : 'The monthly budget was exceeded.'}
                    </p>
                  )}
                  {budgetPercent >= 80 && budgetPercent < 100 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ {isCurrent ? "You've used" : 'Used'} {budgetPercent}% of the monthly budget.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">No budget was set for {periodLabel}.</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">
                Savings Goals <span className="font-normal text-xs text-gray-400">(current progress)</span>
              </h3>
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
          <h2 className="font-semibold mb-3">{isCurrent ? 'Recent Transactions' : `Transactions in ${periodLabel}`}</h2>
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-400">
              {isCurrent ? 'No transactions yet this month.' : `No transactions in ${periodLabel}.`}
            </p>
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
    </div>
  );
};

export default Dashboard;
