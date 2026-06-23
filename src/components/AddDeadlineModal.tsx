import React, { useState } from 'react';
import { Deadline } from '../types';
import { Shield, Sparkles, Calendar, Plus, Hourglass, Sliders, AlertTriangle } from 'lucide-react';

interface AddDeadlineModalProps {
  onAdd: (newDeadline: Deadline) => void;
  onClose: () => void;
}

export default function AddDeadlineModal({ onAdd, onClose }: AddDeadlineModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(3);
  const [bufferRatio, setBufferRatio] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) {
      setError('Title and Due Date are indeed required!');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/analyze-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          targetDate,
          availableHoursPerDay,
          bufferRatio
        })
      });

      if (!res.ok) {
        throw new Error('Server returned error while analyzing the goal.');
      }

      const analyzed = await res.json();
      
      const newDeadline: Deadline = {
        id: 'dl-' + Date.now().toString(),
        title,
        description,
        targetDate,
        availableHoursPerDay,
        currentProgress: 0,
        status: analyzed.status || 'on_track',
        riskScore: analyzed.riskScore || 20,
        riskReason: analyzed.riskReason || "Generative estimation completed successfully.",
        estimatedHours: analyzed.estimatedHours || 10,
        subtasks: (analyzed.subtasks || []).map((st: any, idx: number) => ({
          ...st,
          id: `st-${Date.now()}-${idx}`,
          completed: false
        })),
        blockerDiagnoses: [],
        recoveryHistory: []
      };

      onAdd(newDeadline);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to contact Gemini Priming service. Please verify your GEMINI_API_KEY.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn" id="add-deadline-modal">
      <div className="glass bg-[#0c0f17]/90 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden">
        {/* Immersive glow inside modal */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-2.5 mb-5 select-none pb-4 border-b border-white/10 relative z-10">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/25">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Initialize Deadline Guardian Patrol</h3>
            <p className="text-xs text-slate-400">Gemini will analyze work complexity and formulate subtasks schedule.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2 relative z-10">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">GOAL / MEMO TITLE</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write Literature Review Paper on NLP models"
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">NOTES OR ASSIGNMENT OVERVIEW (RECOMMENDED)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include rubric details or rubrics to help Gemini make estimates..."
              className="w-full h-20 bg-black/40 border border-white/10 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">DEADLINE DUE DATE</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={targetDate}
                  placeholder="e.g. 2023-08-01"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">BUFFER MARGIN LEVEL</label>
              <select
                value={bufferRatio}
                title="Buffer Margin Level"
                onChange={(e) => setBufferRatio(parseFloat(e.target.value))}
                className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-sm outline-none transition"
              >
                <option value="1.0" className="bg-[#050507]">Standard No Buffer (1.0x)</option>
                <option value="1.2" className="bg-[#050507]">Guarded Moderate Buffer (1.2x)</option>
                <option value="1.5" className="bg-[#050507]">Hyper-Safe Buffer (1.5x)</option>
              </select>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-sans tracking-wider">
                <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
                AVAILABLE STUDY HOURS PER DAY
              </label>
              <span className="text-sm font-bold text-indigo-400">{availableHoursPerDay} hrs/day</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              placeholder="e.g. 3"
              value={availableHoursPerDay}
              onChange={(e) => setAvailableHoursPerDay(parseInt(e.target.value))}
              className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              How many hours can you reasonably spend daily on this *specific* task?
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-medium text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Gemini Crafting Plan...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Activate Patrol
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
