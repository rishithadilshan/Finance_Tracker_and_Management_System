import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const now = new Date();
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString('default', { month: 'short' }));

const Reports = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [monthly, setMonthly] = useState(null);
  const [yearly, setYearly] = useState(null);

  const money = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'USD', maximumFractionDigits: 0 }).format(n || 0);

  const loadMonthly = useCallback(async () => {
    const res = await api.get('/reports/monthly', { params: { month, year } });
    setMonthly(res.data);
  }, [month, year]);

  const loadYearly = useCallback(async () => {
    const res = await api.get('/reports/yearly', { params: { year } });
    setYearly(res.data);
  }, [year]);

  useEffect(() => {
    if (tab === 'monthly') loadMonthly();
    else loadYearly();
  }, [tab, loadMonthly, loadYearly]);

  const yearlyChartData = yearly?.months.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    Income: m.income,
    Expense: m.expense,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Reports</h1>
        <div className="flex gap-2 text-sm">
          <div className="flex rounded-md border overflow-hidden">
            <button
              className={`px-3 py-1.5 ${tab === 'monthly' ? 'bg-brand-600 text-white' : 'bg-white'}`}
              onClick={() => setTab('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-3 py-1.5 ${tab === 'yearly' ? 'bg-brand-600 text-white' : 'bg-white'}`}
              onClick={() => setTab('yearly')}
            >
              Yearly
            </button>
          </div>
          {tab === 'monthly' && (
            <select className="border rounded-md px-2 py-1.5" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <input type="number" className="border rounded-md px-2 py-1.5 w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      {tab === 'monthly' && monthly && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total Income</div>
              <div className="text-xl font-bold text-emerald-600">{money(monthly.totalIncome)}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total Expenses</div>
              <div className="text-xl font-bold text-red-500">{money(monthly.totalExpense)}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total Savings</div>
              <div className="text-xl font-bold text-brand-700">{money(monthly.totalSavings)}</div>
            </div>
          </div>

          {monthly.highestExpenseCategory && (
            <div className="bg-white rounded-xl border p-4 shadow-sm text-sm">
              Highest expense category: <span className="font-semibold">{monthly.highestExpenseCategory.category}</span> ({money(monthly.highestExpenseCategory.total)})
            </div>
          )}

          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Expenses by Category</h2>
            {monthly.expensesByCategory.length === 0 ? (
              <p className="text-sm text-gray-400">No expenses this month.</p>
            ) : (
              <div className="space-y-2">
                {monthly.expensesByCategory.map((c) => (
                  <div key={c.category} className="flex justify-between text-sm border-b pb-1">
                    <span>{c.category}</span>
                    <span className="font-medium">{money(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'yearly' && yearly && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total Income</div>
              <div className="text-xl font-bold text-emerald-600">{money(yearly.totalIncome)}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total Expenses</div>
              <div className="text-xl font-bold text-red-500">{money(yearly.totalExpense)}</div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total Savings</div>
              <div className="text-xl font-bold text-brand-700">{money(yearly.totalSavings)}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Income vs Expense by Month</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
                <Bar dataKey="Income" fill="#16a34a" />
                <Bar dataKey="Expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
