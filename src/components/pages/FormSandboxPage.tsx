import React, { useState } from 'react';
import { CheckSquare, CheckCircle, AlertCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';

interface Props {
  onNavigate: (url: string) => void;
}

export const FormSandboxPage: React.FC<Props> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'developer',
    newsletter: true,
    experienceLevel: 'intermediate',
    bio: '',
  });

  const [counter, setCounter] = useState(0);
  const [items, setItems] = useState<string[]>(['Setup environment', 'Connect Gemini API']);
  const [newItemText, setNewItemText] = useState('');
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedData({ ...formData, counter, itemsCount: items.length });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems([...items, newItemText.trim()]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <CheckSquare className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">DOM Testing Laboratory</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Interactive Elements & Form Sandbox</h1>
          <p className="text-xs text-slate-400 mt-1">
            A comprehensive playground with various HTML input types, buttons, dynamic lists, and stateful widgets for browser agent testing.
          </p>
        </div>

        {/* Counter Widget */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Interactive Counter</h3>
            <p className="text-xs text-slate-400">Test clicking buttons to modify state</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="btn-decrement"
              data-agent-id="btn-decrement"
              onClick={() => setCounter((c) => c - 1)}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span
              id="counter-value"
              data-agent-id="counter-value"
              className="w-12 text-center text-lg font-mono font-bold text-purple-400"
            >
              {counter}
            </span>
            <button
              id="btn-increment"
              data-agent-id="btn-increment"
              onClick={() => setCounter((c) => c + 1)}
              className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
            <button
              id="btn-reset-counter"
              data-agent-id="btn-reset-counter"
              onClick={() => setCounter(0)}
              className="p-2 text-slate-400 hover:text-white"
              title="Reset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Todo / Items List */}
        <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
          <h3 className="text-sm font-bold text-white">Dynamic Checklist Items</h3>
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              id="item-input"
              data-agent-id="item-input"
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add item (e.g. Verify token reduction)..."
              className="flex-1 px-3 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
            />
            <button
              id="btn-add-item"
              data-agent-id="btn-add-item"
              type="submit"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg border border-slate-800 text-xs"
              >
                <span className="text-slate-200">{item}</span>
                <button
                  data-agent-id={`btn-remove-item-${idx}`}
                  onClick={() => handleRemoveItem(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Complex Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 space-y-4">
          <h3 className="text-sm font-bold text-white">Comprehensive User Registration Form</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                id="form-full-name"
                data-agent-id="form-full-name"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ada Lovelace"
                className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                id="form-email"
                data-agent-id="form-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ada@example.com"
                className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Role</label>
              <select
                id="form-role-select"
                data-agent-id="form-role-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
              >
                <option value="developer">Software Engineer</option>
                <option value="researcher">AI Researcher</option>
                <option value="designer">Product Designer</option>
                <option value="qa">Automation Tester</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Experience Level</label>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="experienceLevel"
                    value="junior"
                    checked={formData.experienceLevel === 'junior'}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    data-agent-id="radio-junior"
                    className="accent-purple-500"
                  />
                  <span>Junior</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="experienceLevel"
                    value="intermediate"
                    checked={formData.experienceLevel === 'intermediate'}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    data-agent-id="radio-intermediate"
                    className="accent-purple-500"
                  />
                  <span>Intermediate</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="experienceLevel"
                    value="senior"
                    checked={formData.experienceLevel === 'senior'}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    data-agent-id="radio-senior"
                    className="accent-purple-500"
                  />
                  <span>Senior</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Developer Bio</label>
            <textarea
              id="form-bio-textarea"
              data-agent-id="form-bio-textarea"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about your background with AI agents and browser automation..."
              className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="form-newsletter-checkbox"
              data-agent-id="form-newsletter-checkbox"
              type="checkbox"
              checked={formData.newsletter}
              onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-purple-500 cursor-pointer"
            />
            <label htmlFor="form-newsletter-checkbox" className="text-xs text-slate-300 cursor-pointer">
              Subscribe to Firefox Agent ecosystem release updates
            </label>
          </div>

          <button
            id="form-submit-btn"
            data-agent-id="form-submit-btn"
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow"
          >
            Submit Application Form
          </button>
        </form>

        {/* Submission Result */}
        {submittedData && (
          <div
            id="form-success-banner"
            data-agent-id="form-success-banner"
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Form Successfully Submitted!</span>
            </div>
            <pre className="p-3 bg-slate-950/80 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
