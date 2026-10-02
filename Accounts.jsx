import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Accounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ name: '', type: 'cash', balance: 0 });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '' });
  const [error, setError] = useState('');

  const money = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'USD', maximumFractionDigits: 0 }).format(n || 0);

  const load = useCallback(async () => {
    const res = await api.get('/accounts');
    setAccounts(res.data.accounts);
    setTotal(res.data.total);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/accounts', { ...form, balance: Number(form.balance) });
      setForm({ name: '', type: 'cash', balance: 0 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this account?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/accounts/transfer', { ...transferForm, amount: Number(transferForm.amount) });
      setTransferForm({ fromAccountId: '', toAccountId: '', amount: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Accounts</h1>
        <div className="text-sm text-gray-500">
          Total across accounts: <span className="font-semibold text-brand-700">{money(total)}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded">{error}</div>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <div key={a._id} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs text-gray-400 uppercase">{a.type.replace('_', ' ')}</div>
              </div>
              <button onClick={() => handleDelete(a._id)} className="text-xs text-red-500">
                Delete
              </button>
            </div>
            <div className="text-2xl font-bold mt-3 text-brand-700">{money(a.balance)}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Add Account</h2>
          <form onSubmit={handleCreate} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Type</label>
              <select
                className="w-full border rounded-md px-3 py-1.5"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="savings">Savings</option>
                <option value="credit_card">Credit Card</option>
                <option value="wallet">Digital Wallet</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Starting Balance</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-md px-3 py-1.5"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
              />
            </div>
            <button className="w-full bg-brand-600 text-white rounded-md py-2 font-medium hover:bg-brand-700">
              Add Account
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Transfer Between Accounts</h2>
          <p className="text-xs text-gray-400 mb-3">Transfers move money between your own accounts — they're not counted as income or expense.</p>
          <form onSubmit={handleTransfer} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1">From</label>
              <select
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={transferForm.fromAccountId}
                onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({money(a.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">To</label>
              <select
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={transferForm.toAccountId}
                onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              />
            </div>
            <button className="w-full bg-gray-800 text-white rounded-md py-2 font-medium hover:bg-gray-900">
              Transfer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
