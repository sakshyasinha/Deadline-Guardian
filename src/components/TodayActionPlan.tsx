import React, { useState, useEffect } from 'react';
import { Deadline, UserPreferences } from '../types';
import { Sparkles, RefreshCw, CheckCircle2, Flame, AlertCircle, PlayCircle, Eye, Sword, Medal } from 'lucide-react';

interface AIMission {
  goal: string;
  subtaskAssociated: string;
  durationMin: number;
  successCriteria: string[];
  progressGainPredict: number;
  difficulty: 'Low' | 'Medium' | 'High';
  confidence: number;
  timeOfDayAdvice: string;
  completed?: boolean;
}

interface TodayActionPlanProps {
  deadlines: Deadline[];
  preferences: UserPreferences;
  onToggleSubtask: (deadlineId: string, subtaskId: string) => void;
}

export default function TodayActionPlan({ deadlines, preferences, onToggleSubtask }: TodayActionPlanProps) {
  const [missions, setMissions] = useState<AIMission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDeadlines = deadlines.filter((d) => d && d.status !== 'completed');

  // Gathers undone subtasks
  const allIncomplete = activeDeadlines.flatMap((d) =>
    (d.subtasks || [])
      .filter((t) => t && !t.completed)
      .map((t) => ({ ...t, deadlineId: d.id, deadlineTitle: d.title }))
  );

  // Local deterministic fallback generator for instant visual load
  const generateLocalMissions = (): AIMission[] => {
    if (allIncomplete.length === 0) return [];
    
    return allIncomplete.slice(0, 3).map((task, index) => {
      let durationMin = task.estimatedHours * 60;
      if (durationMin > 120) durationMin = 50; // cap at single deep sprint

      return {
        goal: task.title,
        subtaskAssociated: task.title,
        durationMin: Math.round(durationMin),
        successCriteria: [
          `Setup functional boundaries & sandbox environment`,
          `Draft core layout skeleton matching target output`,
          `Review performance parameters & grammar guidelines`
        ],
        progressGainPredict: Math.round(100 / Math.max(1, task.estimatedHours)),
        difficulty: task.energyRequired === 'high' ? 'High' : task.energyRequired === 'medium' ? 'Medium' : 'Low',
        confidence: 85 - (index * 8),
        timeOfDayAdvice: index === 0 ? `Peak energetic zone (${preferences.peakEnergy})` : 'Refining slot'
      };
    });
  };

  const fetchAIMissions = async () => {
    if (activeDeadlines.length === 0) {
      setMissions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/copilot-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlines: activeDeadlines, preferences }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data && Array.isArray(data) && data.length > 0) {
        setMissions(data);
      } else {
        setMissions(generateLocalMissions());
      }
    } catch (err) {
      console.error("AI Mission generation failed:", err);
      // Seamlessly fall back
      setMissions(generateLocalMissions());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIMissions();
  }, [deadlines]);

  const handleMissionCheck = (missionGoal: string) => {
    // Find matching incomplete tasks to coordinate the checkoff
    const associated = allIncomplete.find(t => t.title === missionGoal || missionGoal.toLowerCase().includes(t.title.toLowerCase()));
    
    if (associated) {
      onToggleSubtask(associated.deadlineId, associated.id);
    }
    
    // Toggle check locally in the view
    setMissions(prev => 
      prev.map(m => m.goal === missionGoal ? { ...m, completed: !m.completed } : m)
    );
  };

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden" id="today-action-plan">
      {/* Absolute background visual aura */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/15 pb-4 mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bgColor bg-indigo-500/10 border border-indigo-500/20 rounded text-indigo-400">
              <Sword className="w-4 h-4 animate-pulse" />
            </span>
            <h2 className="text-base font-extrabold text-white tracking-tight">Today&apos;s Energized Copilot Flow</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic study sprints engineered around target project timelines and circadian neurochemical peaks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 rounded-lg font-mono text-[9px] uppercase font-bold tracking-wider">
            {preferences.peakEnergy.toUpperCase()} APEX WINDOW
          </span>
          <button
            onClick={fetchAIMissions}
            disabled={loading}
            className="p-1 px-2 border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 hover:text-white rounded-lg text-[9px] font-bold font-mono transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            RESET MATRIX
          </button>
        </div>
      </div>

      {/* Context Trigger Warning */}
      {allIncomplete.length > 0 && (
        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2.5 mb-5 relative z-10 text-[11px] text-indigo-200">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong>AI Copilot Command Tip:</strong> Your highest return-on-effort today occurs during your <strong>{preferences.peakEnergy} slot</strong>. Attack High-Difficulty battles there to increase completion likelihood by 3.4x.
          </div>
        </div>
      )}

      {/* Grid rendering for missions */}
      {loading && missions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center" id="missions-loader">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
          <p className="text-sm text-slate-300 font-bold">Synthesizing Tactical Missions...</p>
          <span className="text-xs text-slate-500">Evaluating deadline proximity ratio against workload backlog...</span>
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-10 rounded-xl border border-dashed border-white/10 p-4 relative z-10">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center rounded-full mx-auto mb-3">
            <Medal className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Patrol Discharged - All subtasks neutralized!</p>
          <p className="text-xs text-slate-500 mt-1">Excellent job bypassing fail outcomes. Create or import a new project goal to begin again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10" id="missions-cards-grid">
          {missions.map((mission, index) => {
            const isCompleted = mission.completed;
            
            return (
              <div 
                key={index}
                className={`border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isCompleted 
                    ? 'border-emerald-500/20 bg-emerald-500/[0.01] opacity-75' 
                    : 'border-white/5 bg-white/[0.01] hover:border-indigo-500/15'
                }`}
              >
                <div>
                  {/* Mission Badge Row */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono font-extrabold text-[#7480ff] tracking-widest uppercase">
                      MISSION {index + 1} • {unitFriendlyDuration(mission.durationMin)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider ${
                      mission.difficulty === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                      mission.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                    }`}>
                      {mission.difficulty}
                    </span>
                  </div>

                  {/* Goal Header */}
                  <h3 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2 mb-2">
                    {mission.goal}
                  </h3>

                  {/* Criteria List */}
                  <div className="space-y-2 my-4">
                    <span className="text-[9px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block">SUCCESS CHECKLIST:</span>
                    {mission.successCriteria.map((cri, cidx) => (
                      <div key={cidx} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-300">
                        <span className="text-indigo-400 shrink-0 select-none">•</span>
                        <span>{cri}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer metrics block */}
                <div>
                  <div className="grid grid-cols-2 gap-2 bg-black/30 border border-white/5 p-2 rounded-xl mb-4 text-center">
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Est. Progress</span>
                      <span className="text-xs font-bold text-emerald-400">+{mission.progressGainPredict}%</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Confidence</span>
                      <span className="text-xs font-bold text-slate-200">{mission.confidence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                    <span className="text-[9px] text-slate-500 italic line-clamp-1 flex-1 font-mono">{mission.timeOfDayAdvice}</span>
                    <button
                      onClick={() => handleMissionCheck(mission.goal)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold font-sans transition shrink-0 ${
                        isCompleted 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/25' 
                          : 'bg-indigo-500 hover:bg-indigo-600 text-black shadow'
                      }`}
                    >
                      {isCompleted ? '✓ Mission Cleared' : 'Engage'}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Convert hours if excessive
function unitFriendlyDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hr = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hr}h ${rem}m` : `${hr}h`;
}
