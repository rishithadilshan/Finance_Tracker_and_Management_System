import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';

const CATEGORIES = ['Food', 'Rent', 'Electricity', 'Water', 'Internet', 'Transport', 'Education', 'Healthcare', 'Shopping', 'Entertainment', 'Other'];

const now = new Date();

const Budgets = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ category: '', amount: '' });
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [payingId, setPayingId] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', accountId: '', description: '' });
  const [payError, setPayError] = useState('');

  const money = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'USD', maximumFractionDigits: 0 }).format(n || 0);

  const load = useCallback(async () => {
    const res = await api.get('/budgets', { params: { month, year } });
    setData(res.data);
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const loadAccounts = useCallback(async () => {
  const res = await api.get('/accounts');
  setAccounts(res.data.accounts);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/budgets', { ...form, amount: Number(form.amount), month, year });
      setForm({ category: '', amount: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    await api.delete(`/budgets/${id}`);
    load();
  };


  const payDate = (b) => {
  const isCurrent = b.month === now.getMonth() + 1 && b.year === now.getFullYear();
  return isCurrent
    ? new Date().toLocaleDateString('en-CA')
    : `${b.year}-${String(b.month).padStart(2, '0')}-15`;
  };

  const openPay = (b) => {
    setPayingId(b._id);
    setPayError('');
    setPayForm({
      amount: b.remaining > 0 ? b.remaining : '',
      accountId: accounts[0]?._id || '',
      description: `${b.category} payment`,
    });
  };

  const handlePay = async (e, b) => {
    e.preventDefault();
    setPayError('');
    try {
      await api.post('/transactions', {
        type: 'expense',
        amount: Number(payForm.amount),
        category: b.category,
        description: payForm.description,
        date: payDate(b),
        accountId: payForm.accountId,
        paymentMethod: 'Budget Pay Now',
      });
      setPayingId(null);
      load();
      loadAccounts();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment failed');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Monthly Budget</h1>
        <div className="flex gap-2 text-sm">
          <select className="border rounded-md px-2 py-1.5" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="border rounded-md px-2 py-1.5 w-24"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
      </div>

      {data && (
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold">Overall Budget</span>
            <span className="text-gray-500">
              {money(data.totalSpent)} / {money(data.totalBudget)}
            </span>
          </div>
          <ProgressBar percent={data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0} />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm md:col-span-1">
          <h2 className="font-semibold mb-3">Set Category Budget</h2>
          {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Monthly Amount</label>
              <input
                type="number"
                min="0"
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <button className="w-full bg-brand-600 text-white rounded-md py-2 font-medium hover:bg-brand-700">
              Save Budget
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-3">
          {data?.budgets.length === 0 && <p className="text-sm text-gray-400">No category budgets set for this month yet.</p>}

          {data?.budgets.map((b) => (
            <div key={b._id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{b.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {money(b.spent)} / {money(b.amount)}
                  </span>
                  <button onClick={() => handleDelete(b._id)} className="text-xs text-red-500">
                    Delete
                  </button>
                </div>
              </div>

              <ProgressBar
                percent={b.percentageUsed}
                color={b.status === 'exceeded' ? 'bg-red-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-brand-500'}
              />
              {b.status === 'exceeded' && (
                <p className="text-xs text-red-500 mt-1">🔴 Exceeded by {money(b.spent - b.amount)}</p>
              )}
              {b.status === 'warning' && <p className="text-xs text-amber-600 mt-1">⚠️ {b.percentageUsed}% used</p>}

              {/* Pay Now */}
              {payingId === b._id ? (
                <form onSubmit={(e) => handlePay(e, b)} className="mt-3 border-t pt-3 space-y-2 text-sm">
                  {payError && <div className="bg-red-50 text-red-600 text-xs p-2 rounded">{payError}</div>}

                  <div>
                    <label className="block text-xs font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className="w-full border rounded-md px-3 py-1.5"
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Pay from</label>
                    <select
                      required
                      className="w-full border rounded-md px-3 py-1.5"
                      value={payForm.accountId}
                      onChange={(e) => setPayForm({ ...payForm, accountId: e.target.value })}
                    >
                      {accounts.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({money(a.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Note</label>
                    <input
                      className="w-full border rounded-md px-3 py-1.5"
                      value={payForm.description}
                      onChange={(e) => setPayForm({ ...payForm, description: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPayingId(null)}
                      className="px-3 py-1.5 rounded-md border text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </form>
                  ) : (
                    b.remaining > 0 && (
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => openPay(b)}
                          className="px-4 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                        >
                          Pay Now
                        </button>
                      </div>
                    )
                  )}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default Budgets;
