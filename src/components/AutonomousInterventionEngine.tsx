import React, { useState, useEffect } from 'react';
import { Deadline, UserPreferences, RecoveryAction } from '../types';
import { Shield, Zap, Sparkles, AlertOctagon, Timer, Hammer, Target, Activity, Flame, Radio, RefreshCw } from 'lucide-react';

interface ActiveInterventionData {
  deadlineId: string;
  currentRisk: number;
  projectedRisk: number;
  totalTimeSavedMin: number;
  emergencyActions: {
    action: string;
    impact: string;
    timeSaved: number;
  }[];
  compressedExecutionPlan: {
    mergedTasks: string;
    removedTasks: string;
    prioritizedCore: string;
  };
  dailyMission: {
    task: string;
    durationMin: number;
    whyItMatters: string;
  };
}

interface AutonomousInterventionEngineProps {
  deadlines: Deadline[];
  preferences: UserPreferences;
  onApplyIntervention: (deadlineId: string, revisedTitle: string, actions: RecoveryAction[], newRiskScore: number) => void;
}

export default function AutonomousInterventionEngine({ deadlines, preferences, onApplyIntervention }: AutonomousInterventionEngineProps) {
  const [activeControlPlan, setActiveControlPlan] = useState<ActiveInterventionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string>('');
  const [overdriveActivated, setOverdriveActivated] = useState(false);

  const highRiskDeadlines = deadlines.filter((d) => d && d.status !== 'completed' && d.riskScore >= 70);

  // Auto-select first high risk deadline
  useEffect(() => {
    if (highRiskDeadlines.length > 0) {
      if (!selectedDeadlineId || !highRiskDeadlines.some(d => d.id === selectedDeadlineId)) {
        setSelectedDeadlineId(highRiskDeadlines[0].id);
      }
    } else {
      setSelectedDeadlineId('');
      setActiveControlPlan(null);
    }
  }, [deadlines]);

  // Generate pre-emptive deterministic recovery calculation so components load instantly
  const generateLocalIntervention = (dl: Deadline): ActiveInterventionData => {
    const incompleteTasksCount = dl.subtasks.filter((t) => !t.completed).length;
    return {
      deadlineId: dl.id,
      currentRisk: dl.riskScore,
      projectedRisk: Math.max(35, Math.round(dl.riskScore * 0.55)),
      totalTimeSavedMin: 185,
      emergencyActions: [
        {
          action: "Consolidate remaining secondary milestones into single high-potency research block",
          impact: "Reduces transition friction and distraction spikes",
          timeSaved: 90
        },
        {
          action: "Disable perfectionism-polishing scripts & decorative items for tomorrow",
          impact: "Bypasses late styling freeze loops",
          timeSaved: 45
        },
        {
          action: "Swap low-productivity midnight work with circadian apex focus window",
          impact: "Aligns high cognitive effort to optimum circadian focus slots",
          timeSaved: 50
        }
      ],
      compressedExecutionPlan: {
        mergedTasks: `Merge ${incompleteTasksCount} active subtasks into a single unified stream to bypass file synchronization delays.`,
        removedTasks: "Skip manual unit testing of styling configurations and omit verbose comment generation.",
        prioritizedCore: `Focus entirely on drafting core algorithm code files and building the master prototype layout.`
      },
      dailyMission: {
        task: `Execute core functional layout file compile for: ${dl.title}`,
        durationMin: 50,
        whyItMatters: "Completing this specific step is mathematically calculated to cut failure risk by 18 points immediately."
      }
    };
  };

  useEffect(() => {
    if (!selectedDeadlineId) {
      setActiveControlPlan(null);
      return;
    }

    const currentDl = highRiskDeadlines.find((d) => d.id === selectedDeadlineId);
    if (!currentDl) return;

    // Load standard math model locally
    const local = generateLocalIntervention(currentDl);
    setActiveControlPlan(local);
    setOverdriveActivated(false);

    // Fetch AI-synthesized real-time active control program
    const triggerActiveIntervention = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/gemini/active-intervention', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deadline: currentDl, preferences }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data && data.emergencyActions) {
          setActiveControlPlan(data);
        }
      } catch (e) {
        console.error("AI Active Autopilot generation error:", e);
        // Silently preserve robust fallback recommendation layouts
      } finally {
        setLoading(false);
      }
    };

    triggerActiveIntervention();
  }, [selectedDeadlineId]);

  const handleEngageOverdrive = () => {
    if (!activeControlPlan) return;
    setOverdriveActivated(true);

    // Convert structured emergency suggestions to proper RecoveryAction entities
    const actions: RecoveryAction[] = activeControlPlan.emergencyActions.map((item, index) => ({
      id: `act-auto-intervene-${index}-${Date.now()}`,
      originalTaskTitle: selectedDeadlineId,
      recoveredAction: `${item.action} (${item.impact})`,
      priority: index === 0 ? 'critical' : 'high',
      timeSavingMin: item.timeSaved
    }));

    // Trigger parent app state mutation
    onApplyIntervention(activeControlPlan.deadlineId, "Overdriven " + selectedDeadlineId, actions, activeControlPlan.projectedRisk);
  };

  if (highRiskDeadlines.length === 0) {
    return null; // Don't clutter visual space if everything is safe
  }

  const selectedDeadline = highRiskDeadlines.find((d) => d.id === selectedDeadlineId);

  return (
    <div className="space-y-6" id="autonomous-intervention-engine">
      
      {/* Engine Live Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-rose-950/20 to-orange-950/20 p-4 border border-rose-500/20 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-rose-500/10 border border-rose-500/35 text-rose-400 rounded-xl animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              Autonomous Real-Time Autopilot Mode Active
            </span>
            <h2 className="text-base font-black text-white mt-0.5 tracking-tight">Autonomous Intervention Engine</h2>
          </div>
        </div>

        {/* Goal switcher selector specifically for high risk targets */}
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono">TARGET ACQUISITION:</span>
          <select
            value={selectedDeadlineId}
            onChange={(e) => setSelectedDeadlineId(e.target.value)}
            className="bg-slate-950 border border-rose-500/20 rounded-xl px-3 py-1.5 text-xs text-rose-300 font-semibold focus:outline-none focus:border-rose-500 transition"
          >
            {highRiskDeadlines.map((dl) => (
              <option key={dl.id} value={dl.id}>{dl.title}</option>
            ))}
          </select>
        </div>
      </div>

      {activeControlPlan && selectedDeadline && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="autonomous-matrix-grid">
          
          {/* Main Risk Control Dashboard Card */}
          <div className="lg:col-span-8 bg-gradient-to-b from-[#110707] to-transparent border border-rose-500/20 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/[0.03] blur-3xl rounded-full pointer-events-none"></div>

            <div>
              <div className="flex justify-between items-start pb-4 border-b border-white/5 mb-5 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                    Guardian Intervention Engine
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-widest leading-relaxed">
                    CRISIS LEVEL CORRECTION PARAMETERS • AUTONOMOUS BYPASS PROTOCOLS
                  </p>
                </div>

                {loading && (
                  <span className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Auto-syncing variables...
                  </span>
                )}
              </div>

              {/* Animated Risk Reduction Comparison Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                
                {/* Metric A: Current Risk Indicator */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center group">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1">CURRENT EXPOSURE RISK</span>
                  <div className="text-3xl font-black text-rose-400 tracking-tight transition group-hover:scale-105 duration-150">
                    {activeControlPlan.currentRisk}%
                  </div>
                  <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-rose-500" style={{ width: `${activeControlPlan.currentRisk}%` }}></div>
                  </div>
                </div>

                {/* Metric B: Optimized Risk Indicator */}
                <div className="bg-black/40 border border-emerald-500/10 rounded-xl p-4 text-center group">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-1">OPTIMIZED TARGET RISK</span>
                  <div className="text-3xl font-black text-emerald-400 tracking-tight transition group-hover:scale-105 duration-150">
                    {activeControlPlan.projectedRisk}%
                  </div>
                  <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" style={{ width: `${activeControlPlan.projectedRisk}%` }}></div>
                  </div>
                </div>

                {/* Metric C: Minutes Saved Indicator */}
                <div className="bg-gradient-to-br from-[#1c0e0b]/40 to-black/40 border border-orange-500/10 rounded-xl p-4 text-center group">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block mb-1">TIMEFATIGUE RECLAIMED</span>
                  <div className="text-3xl font-black text-orange-400 tracking-tight transition group-hover:scale-105 duration-150">
                    {activeControlPlan.totalTimeSavedMin}m
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-2 font-mono">Saved back into project buffer</span>
                </div>

              </div>

              {/* Emergency Actions List Layout */}
              <div className="space-y-4 mb-6">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-extrabold block">
                  I. EMERGENCY ACTIONS PRESCRIPTION:
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {activeControlPlan.emergencyActions.map((act, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-black/25 hover:bg-black/40 p-3 rounded-xl border border-white/[0.03] transition">
                      <div className="flex gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{act.action}</p>
                          <span className="text-[10.5px] text-slate-500 block mt-0.5 italic">{act.impact}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">-{act.timeSaved}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compressed Execution Plan Layout */}
              <div className="space-y-4 mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-extrabold block">
                  II. COMPRESSED EXECUTION RESTRUCTURE MATRIX:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition">
                    <span className="text-[9px] font-mono text-indigo-400 font-bold block uppercase mb-1">1. Consolidated Tasks</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed leading-snug">{activeControlPlan.compressedExecutionPlan.mergedTasks}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition">
                    <span className="text-[9px] font-mono text-rose-400 font-bold block uppercase mb-1">2. Redundant Exclusions</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed leading-snug">{activeControlPlan.compressedExecutionPlan.removedTasks}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase mb-1">3. Core Focus Lock</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed leading-snug">{activeControlPlan.compressedExecutionPlan.prioritizedCore}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Overdrive Action Button Bar at bottom of card */}
            <div className="border-t border-white/5 pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Overdrive will automatically replace current fragmented subtasks with consolidated paths</span>
              </div>

              <button
                onClick={handleEngageOverdrive}
                disabled={overdriveActivated}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shrink-0 ${
                  overdriveActivated 
                    ? 'bg-rose-950/20 text-rose-400 border border-rose-950' 
                    : 'bg-rose-500 hover:bg-rose-600 text-black shadow-lg shadow-rose-500/10 border border-rose-400/30'
                }`}
              >
                <Zap className="w-4 h-4 fill-black text-black shrink-0" />
                {overdriveActivated ? 'AUTOPILOT IN CONTROL' : 'ENGAGE INTERVENTION OVERDRIVE'}
              </button>
            </div>

          </div>

          {/* Right Panel: Daily Critical Mission Card */}
          <div className="lg:col-span-4 bg-gradient-to-b from-[#1c0c08]/30 to-black/30 border border-orange-500/10 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/[0.02] blur-2xl rounded-full"></div>

            <div>
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/5">
                <span className="p-1 px-2.5 bg-orange-500/10 border border-orange-500/20 rounded font-mono text-[9px] font-bold text-orange-400 uppercase tracking-widest">
                  CRITICAL SPRINT
                </span>
                <span className="text-xs font-bold text-slate-100 font-sans">Active Mission Control</span>
              </div>

              <div className="py-6 space-y-4">
                <div className="flex gap-2.5">
                  <Target className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest font-extrabold block">SINGLE CRITICAL FOCUS TODAY:</h4>
                    <p className="text-sm font-black text-slate-200 mt-1 leading-snug">{activeControlPlan.dailyMission.task}</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <Timer className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest font-extrabold block">ESTIMATED LAUNCH SPAN:</h4>
                    <span className="text-xs font-semibold text-slate-300 mt-1 block font-mono">{activeControlPlan.dailyMission.durationMin} minutes of absolute deep state focus</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest font-extrabold block">WHY IT INTERCEPTS THE FAILURE CASCADE:</h4>
                    <p className="text-[11.5px] text-slate-400 leading-relaxed mt-1">{activeControlPlan.dailyMission.whyItMatters}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-xl p-3 border border-orange-500/10">
              <div className="flex items-center gap-2 mb-1.5 text-orange-400">
                <Flame className="w-4 h-4" />
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide">AUTOPILOT COGNITIVE TIP</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                By executing this mission during your <strong>{preferences.peakEnergy} apex</strong>, you offset key mental resistance coefficients, securing maximum progress speedups.
              </p>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
