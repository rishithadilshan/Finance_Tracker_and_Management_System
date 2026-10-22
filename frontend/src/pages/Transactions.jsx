import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Electricity', 'Water', 'Internet', 'Transport', 'Education', 'Healthcare', 'Shopping', 'Entertainment', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelancing', 'Business', 'Scholarship', 'Investment', 'Interest', 'Gift', 'Other'];

const emptyForm = { type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().slice(0, 10), accountId: '', paymentMethod: '' };

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ type: '', category: '', search: '', startDate: '', endDate: '' });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const money = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'USD', maximumFractionDigits: 0 }).format(n || 0);

  const loadAccounts = useCallback(async () => {
    const res = await api.get('/accounts');
    setAccounts(res.data.accounts);
    if (res.data.accounts.length && !form.accountId) {
      setForm((f) => ({ ...f, accountId: res.data.accounts[0]._id }));
    }
  }, []); // eslint-disable-line

  const loadTransactions = useCallback(
    async (page = 1) => {
      const params = { page, limit: 15 };
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    },
    [filters]
  );

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  const resetForm = () => {
    setForm({ ...emptyForm, accountId: accounts[0]?._id || '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      resetForm();
      loadTransactions(pagination.page);
      loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleEdit = (t) => {
    setEditingId(t._id);
    setForm({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description || '',
      date: new Date(t.date).toISOString().slice(0, 10),
      accountId: t.accountId?._id || t.accountId,
      paymentMethod: t.paymentMethod || '',
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    loadTransactions(pagination.page);
    loadAccounts();
  };

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl border p-4 shadow-sm sticky top-20">
          <h2 className="font-semibold mb-3">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
          {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="flex gap-2">
              {['expense', 'income'].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, type: t, category: '' })}
                  className={`flex-1 py-1.5 rounded-md border capitalize ${
                    form.type === t ? (t === 'income' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-red-50 border-red-400 text-red-600') : 'border-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Account</label>
              <select
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <input
                type="date"
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <input
                className="w-full border rounded-md px-3 py-1.5"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Payment Method</label>
              <input
                className="w-full border rounded-md px-3 py-1.5"
                placeholder="Cash, Card, Bank transfer..."
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 bg-brand-600 text-white rounded-md py-2 font-medium hover:bg-brand-700">
                {editingId ? 'Update' : 'Add'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-3 rounded-md border">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="md:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 text-sm">
            <input
              placeholder="Search..."
              className="border rounded-md px-2 py-1.5"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select
              className="border rounded-md px-2 py-1.5"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="date"
              className="border rounded-md px-2 py-1.5"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <input
              type="date"
              className="border rounded-md px-2 py-1.5"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
            <button
              className="border rounded-md px-2 py-1.5 text-gray-500"
              onClick={() => setFilters({ type: '', category: '', search: '', startDate: '', endDate: '' })}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-right px-4 py-2">Amount</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-6">
                    No transactions found.
                  </td>
                </tr>
              )}
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{t.description || '—'}</td>
                  <td className="px-4 py-2">{t.category}</td>
                  <td className={`px-4 py-2 text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}
                    {money(t.amount)}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(t)} className="text-xs text-brand-600 font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(t._id)} className="text-xs text-red-500 font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 text-sm">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => loadTransactions(p)}
                className={`px-3 py-1 rounded-md border ${p === pagination.page ? 'bg-brand-600 text-white border-brand-600' : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
