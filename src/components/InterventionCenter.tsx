import React, { useState, useEffect } from 'react';
import { Deadline, UserPreferences, RecoveryAction } from '../types';
import { ShieldAlert, Zap, Compass, RefreshCw, Layers, CheckCircle2, AlertOctagon, HeartHandshake } from 'lucide-react';

interface InterventionDetail {
  deadlineId: string;
  title: string;
  currentRisk: number;
  projectedRisk: number;
  interventionTriggered: boolean;
  emergencyRecoveryPlan: string;
  actions: {
    title: string;
    strategy: string;
    timeSavedMin: number;
    category: string;
  }[];
}

interface InterventionCenterProps {
  deadlines: Deadline[];
  preferences: UserPreferences;
  onApplyIntervention: (deadlineId: string, revisedTitle: string, actions: RecoveryAction[], newRiskScore: number) => void;
}

export default function InterventionCenter({ deadlines, preferences, onApplyIntervention }: InterventionCenterProps) {
  const [interventions, setInterventions] = useState<InterventionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Filter deadlines with risk score > 70%
  const highRiskDeadlines = deadlines.filter((d) => d && d.status !== 'completed' && d.riskScore >= 70);

  // Local fallback calculation if server is down/loading
  const computeLocalInterventions = (): InterventionDetail[] => {
    return highRiskDeadlines.map((dl) => {
      const currentRisk = dl.riskScore;
      const projectedRisk = Math.max(40, Math.round(currentRisk * 0.65));

      return {
        deadlineId: dl.id,
        title: dl.title,
        currentRisk,
        projectedRisk,
        interventionTriggered: true,
        emergencyRecoveryPlan: `Guardian Agent has detected a critical backlog risk. Pre-emptive workload rescue procedures have been successfully triggered.`,
        actions: [
          {
            title: `Consolidate remaining ${dl.subtasks.filter((t)=>!t.completed).length} milestones`,
            strategy: `Merge secondary execution steps into single multi-tier block, removing chronological routing overhead.`,
            timeSavedMin: 90,
            category: 'consolidation'
          },
          {
            title: `Strip optional aesthetic polishing tasks`,
            strategy: `Remove non-essential feedback iterations and focus purely on functional completion parameters.`,
            timeSavedMin: 45,
            category: 'scope_reduction'
          },
          {
            title: `Align high-effort execution to Peak Energy Window`,
            strategy: `Lock down intensive coding or writing into your peak chemical focus window (${preferences.peakEnergy}).`,
            timeSavedMin: 120,
            category: 'chronotype_sync'
          }
        ]
      };
    });
  };

  useEffect(() => {
    if (highRiskDeadlines.length === 0) {
      setInterventions([]);
      return;
    }

    const local = computeLocalInterventions();
    setInterventions(local);

    // Fetch AI-customized interventions via server-side Gemini
    const triggerInterventionFetch = async () => {
      setLoading(true);
      try {
        const promises = highRiskDeadlines.map(async (dl) => {
          const res = await fetch('/api/gemini/intervention', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deadline: dl, preferences }),
          });
          if (!res.ok) throw new Error();
          return await res.json();
        });

        const results = await Promise.all(promises);
        if (results && results.length > 0) {
          setInterventions(results.filter((r) => r && r.actions));
        }
      } catch (err) {
        console.error("AI Intervention dispatch error:", err);
        // Seamless fallback to deterministic robust local advice
      } finally {
        setLoading(false);
      }
    };

    triggerInterventionFetch();
  }, [deadlines]);

  const handleApply = async (dlId: string) => {
    setApplyingId(dlId);
    try {
      const plan = interventions.find((i) => i.deadlineId === dlId);
      if (!plan) return;

      // Map to proper RecoveryAction objects
      const recoveryActions: RecoveryAction[] = plan.actions.map((act, index) => ({
        id: `rec-action-${index}-${Date.now()}`,
        originalTaskTitle: plan.title,
        recoveredAction: `${act.title}: ${act.strategy}`,
        priority: index === 0 ? 'critical' : 'high',
        timeSavingMin: act.timeSavedMin
      }));

      // Apply changes back to App.tsx
      onApplyIntervention(dlId, plan.title, recoveryActions, plan.projectedRisk);
    } catch (e) {
      console.error(e);
    } finally {
      setApplyingId(null);
    }
  };

  if (highRiskDeadlines.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center border border-white/5 relative overflow-hidden" id="guardian-intervention-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex flex-col items-center gap-1.5 py-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-sm text-slate-400 font-medium">All active paths stable. Guardian Intervention is in standby.</p>
          <span className="text-[10px] text-slate-500">Autonomous triggers activate immediately if any goal risk climbs past 70%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="guardian-intervention-center">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            Guardian Intervention Center
          </h2>
        </div>
        {loading && (
          <span className="text-[10px] text-indigo-400 flex items-center gap-1.5 font-mono">
            <RefreshCw className="w-3 h-3 animate-spin" />
            AI-modeling optimization alternatives...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {interventions.map((item) => {
          const totalSaved = item.actions.reduce((sum, current) => sum + current.timeSavedMin, 0);

          return (
            <div 
              key={item.deadlineId}
              className="glass border border-orange-500/20 bg-gradient-to-br from-[#0c0d15] to-[#120b08]/30 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.03] blur-3xl rounded-full pointer-events-none"></div>

              {/* Status Header Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-orange-400 uppercase tracking-widest font-bold">AUTONOMOUS DISPATCH ACTIVATED</span>
                    <h3 className="text-sm font-extrabold text-white mt-0.5">{item.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/40 px-4 py-2 border border-white/5 rounded-xl">
                  <div className="text-center">
                    <span className="text-[9.5px] text-slate-500 block">Risk Status</span>
                    <span className="text-sm font-bold text-rose-400">{item.currentRisk}%</span>
                  </div>
                  <div className="text-slate-600 font-sans mx-1">→</div>
                  <div className="text-center">
                    <span className="text-[9.5px] text-slate-500 block">Optimized Post-Action</span>
                    <span className="text-sm font-bold text-emerald-400">{item.projectedRisk}%</span>
                  </div>
                </div>
              </div>

              {/* Emergency Statement */}
              <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3 mb-5 text-[11.5px] text-orange-300 leading-relaxed font-sans">
                <div className="flex gap-2">
                  <AlertOctagon className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-extrabold block mb-0.5">Emergency Recovery Prescription:</span>
                    {item.emergencyRecoveryPlan}
                  </p>
                </div>
              </div>

              {/* Tactical Recommendations */}
              <div className="space-y-3 mb-5">
                <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">RESCUE MATRIX (ESTIMATED TIME REDUCTION):</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {item.actions.map((act, index) => (
                    <div key={index} className="bg-black/30 border border-white/5 hover:border-white/10 rounded-xl p-4 transition">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                          act.category === 'consolidation' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/25' :
                          act.category === 'scope_reduction' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/25' :
                          'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                        }`}>
                          {act.category}
                        </span>
                        <span className="text-emerald-400 text-xs font-mono font-bold">-{act.timeSavedMin}m</span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-200 leading-snug">{act.title}</h5>
                      <p className="text-[10.5px] text-slate-400 mt-1.5 leading-relaxed">{act.strategy}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Apply Trigger */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>By adopting this layout, you will save approximately <strong className="text-emerald-400 text-sm font-bold font-mono">{totalSaved} minutes</strong> of operational fatigue.</span>
                </div>

                <button
                  onClick={() => handleApply(item.deadlineId)}
                  disabled={applyingId !== null}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2 shrink-0 border border-orange-400/20"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  {applyingId === item.deadlineId ? 'Injecting Rescue Plan...' : 'Apply Rescue Strategy'}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
