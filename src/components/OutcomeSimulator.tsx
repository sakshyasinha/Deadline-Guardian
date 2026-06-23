import React, { useState, useEffect } from 'react';
import { Deadline, UserPreferences } from '../types';
import { TrendingUp, RefreshCw, AlertTriangle, CheckCircle, LineChart, CornerDownRight, Play } from 'lucide-react';

interface SimulationTimelinePoint {
  dayLabel: string;
  withoutProgress: number;
  withProgress: number;
  withoutLabel: string;
  withLabel: string;
}

interface SimulationData {
  deadlineId: string;
  successProbabilityWith: number;
  successProbabilityWithout: number;
  scenarioAExpl: string;
  scenarioBExpl: string;
  timeline: SimulationTimelinePoint[];
}

interface OutcomeSimulatorProps {
  deadlines: Deadline[];
  preferences: UserPreferences;
}

export default function OutcomeSimulator({ deadlines, preferences }: OutcomeSimulatorProps) {
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string>('');
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(false);

  const activeDeadlines = deadlines.filter((d) => d && d.status !== 'completed');

  // Load first active deadline as default selection
  useEffect(() => {
    if (activeDeadlines.length > 0 && !selectedDeadlineId) {
      setSelectedDeadlineId(activeDeadlines[0].id);
    }
  }, [deadlines]);

  // Compute immediate robust prediction simulation data
  const computeLocalSimulation = (dl: Deadline): SimulationData => {
    const isCritical = dl.riskScore >= 70;
    const withoutProb = Math.max(10, 100 - dl.riskScore);
    const withProb = Math.min(98, Math.round(100 - (dl.riskScore * 0.3)));

    const currentP = Math.round(dl.currentProgress || 0);

    const stepWithout = Math.round((100 - currentP) * 0.15);
    const stepWith = Math.round((100 - currentP) * 0.4);

    return {
      deadlineId: dl.id,
      successProbabilityWith: withProb,
      successProbabilityWithout: withoutProb,
      scenarioAExpl: `Compounding procrastination and cognitive load will likely lead to study fatigue. Final milestones will collapse in the final 24 hours.`,
      scenarioBExpl: `Pacing workload evenly and following chronological focus advises stabilizes release cycles, ensuring review and submission is completed with margin.`,
      timeline: [
        {
          dayLabel: 'Day 1',
          withoutProgress: Math.min(95, currentP + stepWithout),
          withProgress: Math.min(100, currentP + stepWith),
          withoutLabel: 'Delayed launch & research scope sprawl',
          withLabel: 'Targeted subtasks checked-off on time'
        },
        {
          dayLabel: 'Day 2',
          withoutProgress: Math.min(95, currentP + stepWithout * 1.5),
          withProgress: Math.min(100, currentP + stepWith * 1.8),
          withoutLabel: 'Perfectionism freeze & mounting panic',
          withLabel: 'Core functional structure deployed'
        },
        {
          dayLabel: 'Day 3',
          withoutProgress: Math.min(95, currentP + stepWithout * 1.8),
          withProgress: Math.min(100, currentP + stepWith * 2.2),
          withoutLabel: 'Late-night frantic study run',
          withLabel: 'Refinement and polish completed'
        },
        {
          dayLabel: 'Deadline',
          withoutProgress: Math.min(95, currentP + stepWithout * 2.0),
          withProgress: 100,
          withoutLabel: 'FAIL: Unfinished submissions',
          withLabel: 'SUCCESS: Beautifully optimized delivery'
        }
      ]
    };
  };

  useEffect(() => {
    if (!selectedDeadlineId) {
      setSimulation(null);
      return;
    }

    const currentDl = activeDeadlines.find((d) => d.id === selectedDeadlineId);
    if (!currentDl) return;

    // Immediately create local math model representation
    const local = computeLocalSimulation(currentDl);
    setSimulation(local);

    // Enrich with server-side analytical simulator model
    const fetchAIsimulation = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/gemini/outcome-simulator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deadline: currentDl, preferences }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data && data.timeline) {
          setSimulation(data);
        }
      } catch (err) {
        console.error("Simulation generation error:", err);
        // Silently preserve mathematically model
      } finally {
        setLoading(false);
      }
    };

    fetchAIsimulation();
  }, [selectedDeadlineId]);

  if (activeDeadlines.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center border border-white/5 relative overflow-hidden" id="outcome-simulator">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
        <p className="text-sm text-slate-400">Add an active deadline to see timeline dual outcome projections.</p>
      </div>
    );
  }

  const selectedDeadline = activeDeadlines.find((d) => d.id === selectedDeadlineId);

  return (
    <div className="space-y-6" id="outcome-simulator">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="p-1 px-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-xs font-mono font-bold text-indigo-400 inline-block">
            TIMEWARP CHRONOMETER
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight mt-1.5">Outcome Simulator</h2>
        </div>

        {/* Goal Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-mono">SIMULATE ACTIVE PATH:</label>
          <select
            value={selectedDeadlineId}
            onChange={(e) => setSelectedDeadlineId(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
          >
            {activeDeadlines.map((dl) => (
              <option key={dl.id} value={dl.id}>{dl.title}</option>
            ))}
          </select>
        </div>
      </div>

      {simulation && selectedDeadline && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Predictive Indicators Header */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario A Card */}
            <div className="bg-black/40 border border-rose-500/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.02] blur-2xl rounded-full"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  SCENARIO A: Ignoring Guardian Recommended Paths
                </span>
                <span className="text-2xl font-black text-rose-400">{100 - simulation.successProbabilityWith}% Fail</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                {simulation.scenarioAExpl}
              </p>
            </div>

            {/* Scenario B Card */}
            <div className="bg-black/40 border border-emerald-500/10 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] blur-2xl rounded-full"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  SCENARIO B: Adopting Guardian Intervention Plan
                </span>
                <span className="text-2xl font-black text-emerald-400">{simulation.successProbabilityWith}% Success</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">
                {simulation.scenarioBExpl}
              </p>
            </div>
          </div>

          {/* Visual Timelines Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold mb-4 block">
                Dual Day-by-Day Projection Paths
              </span>

              {/* Progress Projections Render */}
              <div className="space-y-6 relative">
                {/* Visual Connector vertical line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800"></div>

                {simulation.timeline.map((point, index) => {
                  const isLast = index === simulation.timeline.length - 1;
                  return (
                    <div key={index} className="flex gap-4 relative z-10 transition duration-300">
                      {/* Interactive Node Circular dot */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold ${
                        isLast ? 'bg-indigo-950 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}>
                        {index + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 hover:bg-black/40 p-4 rounded-xl border border-white/[0.02] transition">
                        {/* Point Header info */}
                        <div className="md:col-span-2 flex justify-between items-center pb-2 border-b border-white/5">
                          <span className="text-xs font-bold text-slate-200">{point.dayLabel}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Milestone prediction</span>
                        </div>

                        {/* Scenario A path progress bar */}
                        <div>
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="text-rose-400/80 font-medium">Without Guardian</span>
                            <span className="font-mono text-rose-300">{point.withoutProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-rose-500/60 rounded-full" style={{ width: `${point.withoutProgress}%` }}></div>
                          </div>
                          <p className="text-[10px] text-slate-400 italic line-clamp-1">
                            {point.withoutLabel}
                          </p>
                        </div>

                        {/* Scenario B path progress bar */}
                        <div>
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="text-emerald-400/80 font-medium font-sans">With Guardian Rescue</span>
                            <span className="font-mono text-emerald-300">{point.withProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${point.withProgress}%` }}></div>
                          </div>
                          <p className="text-[10px] text-slate-400 italic line-clamp-1">
                            {point.withLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Simulation Summary Widget */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-gradient-to-b from-indigo-500/5 to-transparent border border-indigo-500/10 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 blur-xl rounded-full"></div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <LineChart className="w-4 h-4" />
                Active Risk Projection
              </h4>

              <div className="py-6 flex flex-col items-center">
                <div className="text-4xl font-extrabold font-sans text-slate-100 tracking-tight">
                  {selectedDeadline.riskScore}%
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-mono">Current Live Risk</span>

                <div className="w-full h-px bg-white/5 my-4"></div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Restructuring pulls this down to <strong className="text-emerald-400 font-bold font-mono">{Math.round(selectedDeadline.riskScore * 0.6)}%</strong> risk score.</span>
                </div>
              </div>

              <div className="bg-black/35 rounded-xl p-3 border border-indigo-400/10">
                <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                  Chronological Tip
                </h5>
                <p className="text-[10.5px] text-slate-400 mt-1 lines-clamp-3">
                  Focus actions during your high energy window (<strong>{preferences.peakEnergy}</strong>) to achieve the Scenario B trajectory slope comfortably.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
