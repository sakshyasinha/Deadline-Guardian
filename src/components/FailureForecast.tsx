import React, { useState, useEffect } from 'react';
import { Deadline, UserPreferences } from '../types';
import { AlertCircle, TrendingDown, Hourglass, BarChart3, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ForecastDetail {
  deadlineId: string;
  title: string;
  failureProbability: number;
  remainingHours: number;
  availableCapacity: number;
  deficitOrSurplus: number;
  daysRemaining: number;
  progressExpected: number;
  progressActual: number;
  riskDrivers: { name: string; score: number }[];
  predictedOutcome: string;
  aiExplanation: string;
}

interface FailureForecastProps {
  deadlines: Deadline[];
  preferences: UserPreferences;
}

export default function FailureForecast({ deadlines, preferences }: FailureForecastProps) {
  const [forecasts, setForecasts] = useState<ForecastDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDeadlines = deadlines.filter((d) => d && d.status !== 'completed');

  // Perform immediate deterministic calculations so the UI is instantaneous
  const computeLocalForecasts = (): ForecastDetail[] => {
    return activeDeadlines.map((dl) => {
      const incomplete = dl.subtasks.filter((t) => !t.completed);
      const remainingHours = incomplete.reduce((sum, t) => sum + t.estimatedHours, 0);

      const msDiff = new Date(dl.targetDate).getTime() - new Date().getTime();
      const daysRemaining = Math.max(1, Math.ceil(msDiff / (1000 * 3600 * 24)));
      const availableCapacity = dl.availableHoursPerDay * daysRemaining;
      const deficitOrSurplus = remainingHours - availableCapacity;

      // Progress vs Expected Progress
      // Assume expected progress is proportional to elapsed time since creation (simulated as starting 5 days ago if not recorded)
      const expectedProgress = Math.min(95, Math.round(100 * (5 / (5 + daysRemaining))));
      const progressActual = Math.round(dl.currentProgress || 0);

      // Prob Calculation: Risk score * some deficit weight
      const deficitRatio = availableCapacity > 0 ? remainingHours / availableCapacity : 2;
      let failureProbability = Math.round((dl.riskScore * 0.7) + (Math.max(0, deficitRatio - 1) * 30));
      failureProbability = Math.min(99, Math.max(5, failureProbability));

      // Quick fallback values for drivers
      const riskDrivers = [
        { name: 'Deadline Proximity', score: Math.round(Math.min(45, (10 / daysRemaining) * 20)) },
        { name: 'Workload Deficit', score: Math.round(Math.min(35, Math.max(0, deficitOrSurplus) * 4)) },
        { name: 'Progress Variance', score: Math.round(Math.max(0, expectedProgress - progressActual) * 0.6) }
      ];

      return {
        deadlineId: dl.id,
        title: dl.title,
        failureProbability,
        remainingHours,
        availableCapacity,
        deficitOrSurplus,
        daysRemaining,
        progressExpected: expectedProgress,
        progressActual,
        riskDrivers,
        predictedOutcome: deficitOrSurplus > 0 ? "Potential incomplete work path at current pace" : "Safe zone, but vigilance required",
        aiExplanation: `At your current velocity, you have a study hour deficit of ${deficitOrSurplus > 0 ? deficitOrSurplus : 0} hours. Path realignment is recommended to ensure completion before the target date.`
      };
    });
  };

  useEffect(() => {
    // Generate immediate layout
    const local = computeLocalForecasts();
    setForecasts(local);

    if (activeDeadlines.length === 0) return;

    // Enrich with server-side AI-generated analysis
    const fetchAIForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/gemini/failure-forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deadlines: activeDeadlines, preferences }),
        });
        if (!res.ok) throw new Error("Could not contact predictive failure forecast engine");
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          // Merge local calculations with AI's explanations and drivers for premium accuracy
          const merged = local.map((loc) => {
            const aiItem = data.find((a: any) => a.deadlineId === loc.deadlineId);
            if (aiItem) {
              return {
                ...loc,
                failureProbability: aiItem.failureProbability ?? loc.failureProbability,
                riskDrivers: aiItem.riskDrivers ?? loc.riskDrivers,
                predictedOutcome: aiItem.predictedOutcome ?? loc.predictedOutcome,
                aiExplanation: aiItem.aiExplanation ?? loc.aiExplanation
              };
            }
            return loc;
          });
          setForecasts(merged);
        }
      } catch (err: any) {
        console.error("AI Forecast error representation:", err);
        // Silently fall back to robust mathematically computed local indicators
      } finally {
        setLoading(false);
      }
    };

    fetchAIForecast();
  }, [deadlines, preferences.bufferRatio, preferences.peakEnergy]);

  if (activeDeadlines.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center border border-white/5 relative overflow-hidden" id="guardian-failure-forecast">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
        <p className="text-sm text-slate-400">All deadline goals are handled or completed. Registered goal forecasts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="guardian-failure-forecast">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs font-mono font-bold text-rose-400">
            PREDICTIVE FAILURE ENGINE
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight">Guardian Failure Forecast</h2>
        </div>
        {loading && (
          <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
            Re-calibrating variables...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {forecasts.map((forecast) => {
          const isHighRisk = forecast.failureProbability >= 70;
          const deficit = forecast.deficitOrSurplus;
          
          return (
            <div 
              key={forecast.deadlineId}
              className={`glass rounded-2xl border transition duration-300 relative overflow-hidden p-6 ${isHighRisk ? 'border-rose-500/20 bg-rose-500/[0.01]' : 'border-white/5 bg-white/[0.01]'}`}
            >
              {/* Top Warning Glow */}
              <div className={`absolute top-0 right-0 w-36 h-36 blur-3xl rounded-full pointer-events-none ${isHighRisk ? 'bg-rose-500/[0.04]' : 'bg-indigo-500/[0.03]'}`}></div>
              
              <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{forecast.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-mono">ID: {forecast.deadlineId} • {forecast.daysRemaining} days remaining</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Failure Prob.</div>
                  <div className={`text-2xl font-black mt-0.5 font-sans tracking-tight ${isHighRisk ? 'text-rose-400' : 'text-amber-400'}`}>
                    {forecast.failureProbability}%
                  </div>
                </div>
              </div>

              {/* Grid Comparison Layout */}
              <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
                <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Available Study</span>
                  <span className="text-xs font-semibold text-slate-300">{forecast.availableCapacity}h</span>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Work Required</span>
                  <span className="text-xs font-semibold text-slate-300">{forecast.remainingHours}h</span>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Time Deficit</span>
                  <span className={`text-xs font-bold ${deficit > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {deficit > 0 ? `+${deficit}h` : `${deficit}h surplus`}
                  </span>
                </div>
              </div>

              {/* Progress vs Expected Timeline */}
              <div className="space-y-3 mb-5 relative z-10">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Current Progress Actual</span>
                    <span className="text-indigo-400 font-semibold">{forecast.progressActual}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${forecast.progressActual}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-medium">Guardian Projected Milestones Benchmark</span>
                    <span className="text-slate-500">{forecast.progressExpected}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full border-r border-indigo-400/50" style={{ width: `${forecast.progressExpected}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Capacity vs Work Comparison Chart (SVG styled) */}
              <div className="bg-black/20 p-3 rounded-xl border border-white/5 mb-4 relative z-10">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-indigo-400" />
                  Velocity Comparison Scale
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-500 w-12 font-mono">CAPACITY</span>
                      <div className="h-2 flex-1 bg-white/5 rounded-md overflow-hidden">
                        <div className="h-full bg-emerald-500/70 rounded-md" style={{ width: `${Math.min(100, (forecast.availableCapacity / Math.max(1, forecast.availableCapacity + forecast.remainingHours)) * 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-500 w-12 font-mono">WORK</span>
                      <div className="h-2 flex-1 bg-white/5 rounded-md overflow-hidden">
                        <div className="h-full bg-rose-500/70 rounded-md" style={{ width: `${Math.min(100, (forecast.remainingHours / Math.max(1, forecast.availableCapacity + forecast.remainingHours)) * 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center font-mono shrink-0">
                    Ratio<br/>
                    <span className="font-bold text-slate-300">
                      {(forecast.availableCapacity > 0 ? (forecast.remainingHours / forecast.availableCapacity).toFixed(1) : '∞')}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Drivers Breakdown */}
              <div className="space-y-2 mb-4 relative z-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Core Risk Drivers:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {forecast.riskDrivers.map((driver, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-black/15 p-1.5 rounded-lg border border-white/[0.02]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-rose-400"></span>
                        {driver.name}
                      </span>
                      <span className="text-rose-300/90 font-mono font-medium">+{driver.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predicted Outcome & Explanation */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 relative z-10">
                <div className="flex gap-2">
                  {isHighRisk ? (
                    <AlertTriangle className="w-4 h-4 text-xs text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-xs text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase text-slate-300 tracking-wider">
                      Predicted Outcome: <span className={isHighRisk ? 'text-rose-400' : 'text-emerald-400'}>{forecast.predictedOutcome}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {forecast.aiExplanation}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
