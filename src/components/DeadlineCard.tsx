import React, { useState } from 'react';
import { Deadline, SubTask, UserPreferences } from '../types';
import { Calendar, Trash2, ShieldAlert, CheckCircle, RefreshCcw, Sparkles, ChevronDown, ChevronUp, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface DeadlineCardProps {
  key?: any;
  deadline: any;
  onToggleSubtask: (deadlineId: string, subtaskId: string) => any;
  onTriggerRecovery: (deadlineId: string) => any;
  onDelete: (deadlineId: string) => any;
  isRecovering: boolean;
}

export default function DeadlineCard({ deadline, onToggleSubtask, onTriggerRecovery, onDelete, isRecovering }: DeadlineCardProps) {
  const [expanded, setExpanded] = useState(true);

  const getRiskBadgeColor = (score: number) => {
    if (score < 40) return 'bg-emerald-950/80 border-emerald-900 text-emerald-400';
    if (score < 70) return 'bg-amber-950/80 border-amber-900/60 text-amber-500';
    return 'bg-rose-950/80 border-rose-900/60 text-rose-400';
  };

  const getRiskStatusText = (score: number) => {
    if (score < 40) return 'LOW RISK';
    if (score < 70) return 'ELEVATING RISK';
    return 'CRITICAL RISK';
  };

  const getDaysLeft = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days < 0 ? 0 : days;
  };

  const daysLeft = getDaysLeft(deadline.targetDate);
  const isHighRisk = deadline.riskScore >= 70;

  return (
    <div 
      className={`glass rounded-2xl transition-all duration-300 relative overflow-hidden ${
        isHighRisk ? 'risk-high' : ''
      }`} 
      id={`deadline-${deadline.id}`}
    >
      {/* Immersive glowing background spot */}
      <div 
        className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none ${
          isHighRisk ? 'bg-rose-500' : 'bg-emerald-500'
        }`}
      ></div>

      {/* Card Header */}
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 mb-3">
            <span className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded uppercase tracking-wider ${
              isHighRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {getRiskStatusText(deadline.riskScore)}
            </span>
            <span className={`mono text-2xl font-bold tracking-tight ${
              isHighRisk ? 'text-rose-500 risk-glow-red' : 'text-emerald-500 risk-glow-green'
            }`}>
              {deadline.riskScore}%
            </span>
          </div>

          <h3 className="text-base font-bold text-white select-all">{deadline.title}</h3>
          {deadline.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-2xl">{deadline.description}</p>
          )}

          <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{daysLeft} days remaining ({new Date(deadline.targetDate).toLocaleDateString()})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition"
            title="Expand/Collapse Plan"
          >
            {expanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={() => onDelete(deadline.id)}
            className="p-2 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition"
            title="Remove Deadline Watch"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-3 bg-white/5 py-3 border-t border-b border-white/10 text-center font-mono relative z-10">
        <div>
          <span className="text-[10px] text-slate-500 block font-sans font-bold tracking-widest">TOTAL WORKLOAD</span>
          <span className="text-sm font-semibold text-slate-200">{deadline.estimatedHours} hrs</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block font-sans font-bold tracking-widest">PROGRESS ENGINE</span>
          <span className="text-sm font-semibold text-indigo-400">{Math.round(deadline.currentProgress || 0)}%</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block font-sans font-bold tracking-widest">BUFFER MULTIPLIER</span>
          <span className="text-sm font-semibold text-indigo-400">1.2x Guard</span>
        </div>
      </div>

      {/* Expanded Subtasks & Recovery UI */}
      {expanded && (
        <div className="p-5 space-y-4">
          {/* Progress bar visual */}
          <div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${deadline.riskScore >= 70 ? 'bg-gradient-to-r from-indigo-500 to-rose-500' : 'bg-gradient-to-r from-indigo-600 to-emerald-500'}`}
                style={{ width: `${deadline.currentProgress || 0}%` }}
              ></div>
            </div>
            {deadline.riskReason && (
              <p className="text-[11px] text-indigo-300 mt-2.5 leading-relaxed bg-indigo-950/20 border border-indigo-900/30 p-2.5 rounded-xl">
                <span className="font-bold">Guardian Diagnostics:</span> {deadline.riskReason}
              </p>
            )}
          </div>

          {/* Subtask Listing */}
          <div>
            <span className="text-xs font-bold text-slate-400 block mb-2.5 uppercase tracking-wider">Guardian Structured Subtask Action Path:</span>
            {(deadline.subtasks || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No actions registered in path.</p>
            ) : (
              <div className="space-y-2">
                {(deadline.subtasks || []).map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-start justify-between p-3 rounded-xl border transition cursor-pointer select-none ${task.completed ? 'bg-emerald-950/20 border-emerald-900/30 text-slate-500 hover:border-emerald-900/50' : 'bg-slate-950/60 border-slate-900 text-slate-200 hover:border-slate-800'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onToggleSubtask(deadline.id, task.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer mt-0.5 accent-indigo-500"
                      />
                      <div>
                        <span className={`text-xs font-medium leading-relaxed block ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 text-[9px] font-mono rounded">
                            {task.estimatedHours} hrs
                          </span>
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${task.completed ? 'bg-slate-900 text-slate-500' : 'bg-indigo-950 text-indigo-300'}`}>
                            {task.phase}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded capitalize ${task.completed ? 'bg-slate-900 text-slate-500' : 'bg-rose-950/50 text-rose-300'}`}>
                            {task.energyRequired} Energy
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 self-center">
                      Target: {new Date(task.recommendedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Recovery Trigger Section when risk is elevated */}
          {deadline.riskScore >= 60 && (
            <div className="p-4 bg-rose-950/30 border border-rose-900/40 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest">CRITICAL DEADLINE FAILURE DETECTED</h4>
                  <p className="text-xs text-rose-200 mt-0.5 leading-relaxed">
                    Workload density is too high to complete with current progress standards. Let the Guardian restructure, automate code scope trimming, and write a salvage path.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onTriggerRecovery(deadline.id)}
                disabled={isRecovering}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                {isRecovering ? (
                  <>
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    Engaging Recovery Agent...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Recovery/Salvage Plan
                  </>
                )}
              </button>
            </div>
          )}

          {/* Recovery Plan logs */}
          {deadline.recoveryHistory.length > 0 && (
            <div className="pt-3.5 border-t border-slate-900">
              <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wide">Historical Salvage Recoveries:</span>
              <div className="space-y-2">
                {deadline.recoveryHistory.map((rec, rIdx) => (
                  <div key={rIdx} className="p-3 bg-slate-950 rounded-xl border border-indigo-950">
                    <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5">
                      <span>PLAN RESCUED</span>
                      <span>{new Date(rec.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-indigo-300 italic mb-2">&ldquo;{rec.reason}&rdquo;</p>
                    <div className="space-y-1">
                      {rec.actions.map((act) => (
                        <div key={act.id} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-1" />
                          <span>
                            <strong className="text-white">{act.originalTaskTitle}:</strong> {act.recoveredAction} (saved ~{act.timeSavingMin} min)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
