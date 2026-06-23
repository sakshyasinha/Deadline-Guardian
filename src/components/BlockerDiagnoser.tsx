import React, { useState } from 'react';
import { Deadline, BlockerDiagnosis } from '../types';
import { ShieldAlert, Sparkles, AlertCircle, CheckCircle, Brain, Smile } from 'lucide-react';

interface BlockerDiagnoserProps {
  deadlines: Deadline[];
  onAddDiagnosis: (deadlineId: string, diagnosis: BlockerDiagnosis) => void;
}

export default function BlockerDiagnoser({ deadlines, onAddDiagnosis }: BlockerDiagnoserProps) {
  const [selectedDeadlineId, setSelectedDeadlineId] = useState('');
  const [blockerText, setBlockerText] = useState('');
  const [selectedBlockerCategory, setSelectedBlockerCategory] = useState<string>('unclear_steps');
  const [loading, setLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<BlockerDiagnosis | null>(null);
  const [completedMicroStep, setCompletedMicroStep] = useState(false);

  const activeDeadlines = deadlines.filter(d => d.status !== 'completed');

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeadlineId) return;
    setLoading(true);
    setDiagnosisResult(null);
    setCompletedMicroStep(false);

    try {
      const selectedDl = deadlines.find(d => d.id === selectedDeadlineId);
      const res = await fetch('/api/gemini/diagnose-blockers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedDl?.title || '',
          currentProgress: selectedDl?.currentProgress || 0,
          blockerNotes: `${selectedBlockerCategory.toUpperCase()} blocker. User says: ${blockerText}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newDiag: BlockerDiagnosis = {
          id: 'diag-' + Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: data.type,
          analysis: data.analysis,
          microStep: data.microStep
        };
        setDiagnosisResult(newDiag);
        onAddDiagnosis(selectedDeadlineId, newDiag);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden" id="blocker-diagnoser">
      {/* Glow background asset */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Blocker & Procrastination Diagnosis</h2>
          <p className="text-xs text-slate-400 mt-0.5">Diagnose underlying reasons for delay and get custom micro-actions.</p>
        </div>
      </div>

      {activeDeadlines.length === 0 ? (
        <div className="text-center py-8 bg-black/45 rounded-xl border border-white/5 relative z-10">
          <p className="text-sm text-slate-400">Please add or load a deadline goal first to unlock diagnoses!</p>
        </div>
      ) : (
        <form onSubmit={handleDiagnose} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">WHICH GOAL/DEADLINE ARE YOU DELAYING?</label>
            <select
              required
              value={selectedDeadlineId}
              title="Select a goal or deadline"
              onChange={(e) => setSelectedDeadlineId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2 text-sm outline-none transition"
            >
              <option value="" className="bg-[#050507]">-- Choose goal --</option>
              {activeDeadlines.map((dl) => (
                <option key={dl.id} value={dl.id} className="bg-[#050507]">{dl.title} (Risk: {dl.riskScore}%)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'perfectionism', label: 'Perfectionism / Fear' },
              { id: 'overwhelm', label: 'Work Overwhelm' },
              { id: 'lack_of_interest', label: 'Low Motivation' },
              { id: 'exhaustion', label: 'Physical Burnout' },
              { id: 'unclear_steps', label: 'Unclear Next Steps' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedBlockerCategory(cat.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition border ${selectedBlockerCategory === cat.id ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">HOW ARE YOU FEELING RIGHT NOW?</label>
            <textarea
              required
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              placeholder="e.g. I keep putting off doing the actual presentation writing because I'm worried my thesis is weak or I don't know where to start..."
              className="w-full h-20 bg-black/40 border border-white/10 focus:border-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-indigo-300" />
                Diagnosing Underlying Inhibitors...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Run Blocker Diagnosis
              </>
            )}
          </button>
        </form>
      )}

      {diagnosisResult && (
        <div className="mt-5 p-4 bg-white/5 border border-white/10 rounded-xl space-y-3.5 animate-fadeIn relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-mono rounded-md uppercase font-bold border border-rose-500/20">
              {diagnosisResult.type.replace('_', ' ')} Detected
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {new Date(diagnosisResult.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Guardian Analysis:</h4>
            <p className="text-sm text-slate-200 leading-relaxed italic">
              &ldquo;{diagnosisResult.analysis}&rdquo;
            </p>
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Your 5-Minute Micro-Task Strategy:
            </h5>
            <p className="text-sm text-slate-100 font-medium">
              {diagnosisResult.microStep}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setCompletedMicroStep(true)}
                disabled={completedMicroStep}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${completedMicroStep ? 'bg-emerald-950 text-emerald-400' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}
              >
                {completedMicroStep ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Micro-Task Completed!
                  </>
                ) : (
                  'Done, I started!'
                )}
              </button>
              {completedMicroStep && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Smile className="w-4 h-4" /> Inertia broken! Keep going!
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
