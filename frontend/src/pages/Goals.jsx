import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
  const [contributeAmounts, setContributeAmounts] = useState({});
  const [error, setError] = useState('');

  const money = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'USD', maximumFractionDigits: 0 }).format(n || 0);

  const load = useCallback(async () => {
    const res = await api.get('/goals');
    setGoals(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/goals', {
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
      });
      setForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create goal');
    }
  };

  const handleContribute = async (id) => {
    const amount = Number(contributeAmounts[id]);
    if (!amount || amount <= 0) return;
    await api.post(`/goals/${id}/contribute`, { amount });
    setContributeAmounts({ ...contributeAmounts, [id]: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await api.delete(`/goals/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Savings Goals</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm md:col-span-1">
          <h2 className="font-semibold mb-3">New Goal</h2>
          {error && <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-3">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1">Goal Name</label>
              <input
                required
                placeholder="e.g. Buy a laptop"
                className="w-full border rounded-md px-3 py-1.5"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Amount</label>
              <input
                type="number"
                min="0"
                required
                className="w-full border rounded-md px-3 py-1.5"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Already Saved</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded-md px-3 py-1.5"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Date (optional)</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-1.5"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>
            <button className="w-full bg-brand-600 text-white rounded-md py-2 font-medium hover:bg-brand-700">
              Create Goal
            </button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-3">
          {goals.length === 0 && <p className="text-sm text-gray-400">No savings goals yet — create your first one.</p>}
          {goals.map((g) => (
            <div key={g._id} className="bg-white rounded-xl border p-4 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-xs text-gray-400">
                    {money(g.currentAmount)} / {money(g.targetAmount)}
                    {g.requiredMonthlySaving != null && <> · save {money(g.requiredMonthlySaving)}/mo to reach it on time</>}
                  </div>
                </div>
                <button onClick={() => handleDelete(g._id)} className="text-xs text-red-500">
                  Delete
                </button>
              </div>
              <ProgressBar percent={g.progress} color="bg-sky-500" />
              <div className="flex gap-2 mt-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Add contribution"
                  className="border rounded-md px-2 py-1 text-sm flex-1"
                  value={contributeAmounts[g._id] || ''}
                  onChange={(e) => setContributeAmounts({ ...contributeAmounts, [g._id]: e.target.value })}
                />
                <button
                  onClick={() => handleContribute(g._id)}
                  className="text-sm px-3 py-1 rounded-md bg-gray-800 text-white hover:bg-gray-900"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Goals;
