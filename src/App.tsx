import React, { useState, useEffect } from 'react';
import { Deadline, UserPreferences, GoogleCalendarEvent, GoogleTaskItem, BlockerDiagnosis, RecoveryAction } from './types';
import DeadlineCard from './components/DeadlineCard';
import TodayActionPlan from './components/TodayActionPlan';
import BlockerDiagnoser from './components/BlockerDiagnoser';
import GoogleSyncPanel from './components/GoogleSyncPanel';
import EnergyConfig from './components/EnergyConfig';
import AddDeadlineModal from './components/AddDeadlineModal';
import FailureForecast from './components/FailureForecast';
import InterventionCenter from './components/InterventionCenter';
import AutonomousInterventionEngine from './components/AutonomousInterventionEngine';
import OutcomeSimulator from './components/OutcomeSimulator';
import GuardianMemory from './components/GuardianMemory';
import { Shield, Sparkles, Plus, RefreshCw, Layers, Calendar, Compass, ShieldCheck, HeartPulse } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'deadline_guardian_data';
const PREFS_STORAGE_KEY = 'deadline_guardian_prefs';

const DEFAULT_PREFERENCES: UserPreferences = {
  sleepStart: '23:00',
  sleepEnd: '07:00',
  peakEnergy: 'evening',
  sessionDuration: 50,
  bufferRatio: 1.2
};

const INITIAL_DEADLINES: Deadline[] = [
  {
    id: 'dl-seed-1',
    title: 'Google software engineer intern resume preparation',
    description: 'Update project bio, add React fullstack experience, and polish leetcode questions list.',
    targetDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // 2 days out
    estimatedHours: 12,
    availableHoursPerDay: 3,
    currentProgress: 20,
    status: 'high_risk',
    riskScore: 82,
    riskReason: "High workload volume remaining (10 hours left) compared to the short 2-day window. Prompt salvage recovery recommended.",
    subtasks: [
      { id: 'st-seed-1', title: 'Collect previous project bullet points', estimatedHours: 2, completed: true, recommendedDate: new Date().toISOString().split('T')[0], energyRequired: 'medium', phase: 'research' },
      { id: 'st-seed-2', title: 'Write optimized fullstack React descriptions', estimatedHours: 3, completed: false, recommendedDate: new Date().toISOString().split('T')[0], energyRequired: 'high', phase: 'execution' },
      { id: 'st-seed-3', title: 'Refactor portfolio and test production URLs', estimatedHours: 4, completed: false, recommendedDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0], energyRequired: 'high', phase: 'execution' },
      { id: 'st-seed-4', title: 'Mock peer interview reviews', estimatedHours: 3, completed: false, recommendedDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0], energyRequired: 'medium', phase: 'review' }
    ],
    blockerDiagnoses: [],
    recoveryHistory: []
  },
  {
    id: 'dl-seed-2',
    title: 'CS101 final web application term proposal',
    description: 'Construct wireframe assets, setup schema models, and initialize Github structure.',
    targetDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0], // 5 days out
    estimatedHours: 8,
    availableHoursPerDay: 4,
    currentProgress: 50,
    status: 'on_track',
    riskScore: 35,
    riskReason: "Healthy workload density. Remaining time is abundant to comfortably handle refinement and reviews.",
    subtasks: [
      { id: 'st-seed-5', title: 'Sketch database schemas and draw API nodes', estimatedHours: 2, completed: true, recommendedDate: new Date().toISOString().split('T')[0], energyRequired: 'medium', phase: 'research' },
      { id: 'st-seed-6', title: 'Draft standard functional specs markdown', estimatedHours: 2, completed: true, recommendedDate: new Date().toISOString().split('T')[0], energyRequired: 'low', phase: 'research' },
      { id: 'st-seed-7', title: 'Initialize Vite setup and test routes locally', estimatedHours: 2, completed: false, recommendedDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0], energyRequired: 'high', phase: 'execution' },
      { id: 'st-seed-8', title: 'Deploy prototype preview link to Cloud Run', estimatedHours: 2, completed: false, recommendedDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0], energyRequired: 'medium', phase: 'refinement' }
    ],
    blockerDiagnoses: [],
    recoveryHistory: []
  }
];

export default function App() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [recoveringIds, setRecoveringIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    const cachedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);

    if (cachedData) {
      try {
        setDeadlines(JSON.parse(cachedData));
      } catch (e) {
        setDeadlines(INITIAL_DEADLINES);
      }
    } else {
      setDeadlines(INITIAL_DEADLINES);
    }

    if (cachedPrefs) {
      try {
        setPreferences(JSON.parse(cachedPrefs));
      } catch (e) {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }
  }, []);

  // Save to LocalStorage helper
  const saveState = (updatedDeadlines: Deadline[], updatedPrefs = preferences) => {
    setDeadlines(updatedDeadlines);
    setPreferences(updatedPrefs);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedDeadlines));
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updatedPrefs));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggles completeness and runs deterministic live risk scores updates!
  const handleToggleSubtask = (deadlineId: string, subtaskId: string) => {
    const updated = deadlines.map((dl) => {
      if (dl.id !== deadlineId) return dl;

      const subtasks = dl.subtasks.map((st) => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      // Recalculate progress: percentage of completed subtasks
      const completedCount = subtasks.filter(t => t.completed).length;
      const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

      // Deterministic risk scoring calculation:
      const incompleteTasks = subtasks.filter(t => !t.completed);
      const remainingHours = incompleteTasks.reduce((sum, t) => sum + t.estimatedHours, 0);

      const msDiff = new Date(dl.targetDate).getTime() - new Date().getTime();
      const daysLeft = Math.max(1, Math.ceil(msDiff / (1000 * 3600 * 24)));

      const totalWorkCapacity = dl.availableHoursPerDay * daysLeft * preferences.bufferRatio;
      
      let baseRisk = 15;
      if (remainingHours > 0) {
        const ratio = remainingHours / totalWorkCapacity;
        baseRisk = Math.round(ratio * 90);
      } else {
        baseRisk = 0;
      }

      // Constrain risk within limits
      const finalRiskScore = Math.min(100, Math.max(baseRisk === 0 ? 0 : 10, baseRisk));
      
      let finalStatus: Deadline['status'] = 'on_track';
      let riskReason = "Your work pace matches standard timelines comfortably.";

      if (progress === 100) {
        finalStatus = 'completed';
        riskReason = "Goal achieved beautifully before missing deadlines!";
      } else if (finalRiskScore >= 75) {
        finalStatus = 'critical';
        riskReason = `Critical alert: You need ${remainingHours} hours of deep concentration with only ${daysLeft} days remaining. Recommend salvage plan reduction.`;
      } else if (finalRiskScore >= 45) {
        finalStatus = 'high_risk';
        riskReason = `Caution: Highly congested remaining work tasks (${remainingHours} hours). Run blocker check to secure progress.`;
      }

      return {
        ...dl,
        subtasks,
        currentProgress: progress,
        riskScore: finalRiskScore,
        status: finalStatus,
        riskReason
      };
    });

    saveState(updated);
    triggerToast("Study task progress registered securely!");
  };

  // 1. Add new customized analyzed deadline
  const handleAddDeadline = (newDl: Deadline) => {
    const updated = [newDl, ...deadlines];
    saveState(updated);
    triggerToast(`Guardian began patrol on "${newDl.title}"`);
  };

  // 2. Google Calendar imported deadline generator
  const handleImportDeadline = async (event: GoogleCalendarEvent) => {
    // Generate immediate structured analyzed goal for that calendar event by calling Gemini directly
    try {
      const summary = event.summary;
      const targetDate = event.start.dateTime ? event.start.dateTime.split('T')[0] : event.start.date || new Date().toISOString().split('T')[0];
      const desc = event.description || "Imported from GCal.";

      const res = await fetch('/api/gemini/analyze-deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: summary,
          description: desc,
          targetDate,
          availableHoursPerDay: 3,
          bufferRatio: preferences.bufferRatio
        })
      });

      if (res.ok) {
        const analyzed = await res.json();
        const newDl: Deadline = {
          id: 'dl-gcal-' + Date.now().toString(),
          title: summary,
          description: desc,
          targetDate,
          availableHoursPerDay: 3,
          currentProgress: 0,
          status: analyzed.status || 'on_track',
          riskScore: analyzed.riskScore || 25,
          riskReason: analyzed.riskReason || "Imported event successfully scanned by primary planner agent.",
          estimatedHours: analyzed.estimatedHours || 6,
          subtasks: (analyzed.subtasks || []).map((st: any, idx: number) => ({
            ...st,
            id: `st-gcal-${Date.now()}-${idx}`,
            completed: false
          })),
          blockerDiagnoses: [],
          recoveryHistory: []
        };
        saveState([newDl, ...deadlines]);
        triggerToast(`Successfully registered Calendar deadline: "${summary}"`);
      }
    } catch (e) {
      console.error(e);
      triggerToast('Call failed. Verify parameters.');
    }
  };

  // 3. Google Task imported task list generator
  const handleImportTask = (task: GoogleTaskItem) => {
    const title = task.title;
    const targetDate = task.due ? task.due.split('T')[0] : new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0];
    
    // Create a simpler deadline representation based on task title directly
    const newDl: Deadline = {
      id: 'dl-gtask-' + Date.now().toString(),
      title: title,
      description: task.notes || "Imported single focus deliverable from Google Tasks.",
      targetDate,
      availableHoursPerDay: 2,
      currentProgress: 0,
      status: 'on_track',
      riskScore: 20,
      riskReason: "Synchronized directly from Google Tasks list.",
      estimatedHours: 4,
      subtasks: [
        { id: `st-gtask-${Date.now()}-1`, title: `Outline deliverable: ${title}`, estimatedHours: 1.5, completed: false, recommendedDate: targetDate, energyRequired: 'medium', phase: 'research' },
        { id: `st-gtask-${Date.now()}-2`, title: `Draft core execution of ${title}`, estimatedHours: 2.5, completed: false, recommendedDate: targetDate, energyRequired: 'high', phase: 'execution' }
      ],
      blockerDiagnoses: [],
      recoveryHistory: []
    };
    saveState([newDl, ...deadlines]);
    triggerToast(`GTasks Import: "${title}" mapped to subtasks`);
  };

  // 4. Delete deadline
  const handleDeleteDeadline = (id: string) => {
    const updated = deadlines.filter((d) => d.id !== id);
    saveState(updated);
    triggerToast("Deadline guardian patrol dismissed.");
  };

  // 5. Blocker diagnosis appender
  const handleAddDiagnosis = (deadlineId: string, diagnosis: BlockerDiagnosis) => {
    const updated = deadlines.map(dl => {
      if (dl.id !== deadlineId) return dl;
      
      // We can slightly reduce the risk score or keep it unchanged to reward user self-awareness
      const currentDiagnoses = dl.blockerDiagnoses || [];
      const updatedDiagnoses = [diagnosis, ...currentDiagnoses];
      
      // Rewritten to break freezing procrastination: reward the student with 5 points risk cushion
      const adjustedRisk = Math.max(10, dl.riskScore - 5);

      return {
        ...dl,
        blockerDiagnoses: updatedDiagnoses,
        riskScore: adjustedRisk,
        riskReason: `Self-awareness logs registered! Blocker strategy applied: "${diagnosis.microStep}". Keep your inertia broken!`
      };
    });
    saveState(updated);
    triggerToast("Procrastination blocker strategy injected successfully!");
  };

  // 6. RECOVERY AGENT INTEGRATION! Revised plan generator
  const handleTriggerRecovery = async (deadlineId: string) => {
    if (recoveringIds.includes(deadlineId)) return;
    setRecoveringIds(prev => [...prev, deadlineId]);

    try {
      const activeDl = deadlines.find(d => d.id === deadlineId);
      if (!activeDl) return;

      const res = await fetch('/api/gemini/recovery-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deadline: activeDl,
          userPreferences: preferences
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Map the revised plan back into the specific deadline
        const updated = deadlines.map(dl => {
          if (dl.id !== deadlineId) return dl;

          // Preserve finished subtasks and append newly structured recovered actions!
          const finishedSubtasks = dl.subtasks.filter(t => t.completed);
          
          const newlyRecoveredSubtasks = (data.revisedSubtasks || []).map((st: any, idx: number) => ({
            ...st,
            id: `st-recovered-${Date.now()}-${idx}`,
            completed: false
          }));

          const allMergedSubtasks = [...finishedSubtasks, ...newlyRecoveredSubtasks];

          // Calculate revised progress
          const compCount = allMergedSubtasks.filter(t => t.completed).length;
          const progress = allMergedSubtasks.length > 0 ? (compCount / allMergedSubtasks.length) * 100 : 0;

          // Push into recovery planner trace
          const currentTrace = dl.recoveryHistory || [];
          const newHistory = [
            {
              timestamp: new Date().toISOString(),
              reason: data.explanation || "Work scope compressed to prevent deadline compromise.",
              actions: data.recoveryActions || [],
              previousRiskScore: dl.riskScore
            },
            ...currentTrace
          ];

          return {
            ...dl,
            subtasks: allMergedSubtasks,
            currentProgress: progress,
            riskScore: data.newRiskScore || 40,
            status: data.newStatus || 'on_track',
            riskReason: `Plan recovered! Work items optimized. Saved over ${data.recoveryActions?.reduce((acc: number, item: any) => acc + (item.timeSavingMin || 0), 0) || 0} minutes of busywork.`,
            recoveryHistory: newHistory
          };
        });

        saveState(updated);
        triggerToast("Plan Salvaged! Chrono-margins optimized by Recovery Agent.");
      } else {
        triggerToast("Vanguard server error on salvage query. Check logs.");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Failed calling recovery backend.");
    } finally {
      setRecoveringIds(prev => prev.filter(x => x !== deadlineId));
    }
  };

  const handleApplyIntervention = (deadlineId: string, revisedTitle: string, actions: RecoveryAction[], newRiskScore: number) => {
    const updated = deadlines.map(dl => {
      if (dl.id !== deadlineId) return dl;

      const incomplete = dl.subtasks.filter(t => !t.completed);
      const completed = dl.subtasks.filter(t => t.completed);

      // Create consolidated ones
      const consolidatedSubtasks = [
        {
          id: `st-intervene-${Date.now()}-1`,
          title: "Consolidated Milestone: " + (actions[0]?.recoveredAction.split(':')[0] || "Merged action path"),
          estimatedHours: Math.round(incomplete.reduce((acc, t) => acc + t.estimatedHours, 0) * 0.6), // 40% time saved!
          completed: false,
          recommendedDate: dl.targetDate,
          energyRequired: 'high' as const,
          phase: 'execution' as const
        },
        {
          id: `st-intervene-${Date.now()}-2`,
          title: "Guardian Intervention: " + (actions[1]?.recoveredAction.split(':')[0] || "Aesthetic scope reduction"),
          estimatedHours: 0.5,
          completed: false,
          recommendedDate: dl.targetDate,
          energyRequired: 'medium' as const,
          phase: 'refinement' as const
        }
      ];

      const merged = [...completed, ...consolidatedSubtasks];
      const compCount = merged.filter(t => t.completed).length;
      const progress = merged.length > 0 ? (compCount / merged.length) * 100 : 0;

      const trace = dl.recoveryHistory || [];
      const newHistory = [
        {
          timestamp: new Date().toISOString(),
          reason: "Emergency autonomous Guardian Intervention activated to rescue project path.",
          actions,
          previousRiskScore: dl.riskScore
        },
        ...trace
      ];

      return {
        ...dl,
        subtasks: merged,
        currentProgress: progress,
        riskScore: newRiskScore,
        status: 'on_track' as const,
        riskReason: `Intervention activated! Autonomous restructuring trimmed workload by ${actions.reduce((acc, a) => acc + a.timeSavingMin, 0)} minutes.`,
        recoveryHistory: newHistory
      };
    });

    saveState(updated);
    triggerToast("Guardian Rescue Strategy Inject Completed!");
  };

  const handleUpdatePreferences = (updatedPrefs: UserPreferences) => {
    saveState(deadlines, updatedPrefs);
    triggerToast("Circadian preferences synchronized!");
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e8f0] flex flex-col font-sans selection:bg-indigo-600 selection:text-white pb-10" id="deadline-guardian-app">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 px-5 py-3 bg-indigo-950 border border-indigo-500 rounded-xl text-xs font-semibold text-white shadow-2xl flex items-center gap-2 z-55 animate-bounce" id="toast-banner">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Immersive Primary Header Area */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-4 h-4 border-2 border-white rounded-full opacity-80"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white font-sans">Deadline Guardian</h1>
                <span className="text-[10px] font-normal text-indigo-400 px-1.5 py-0.5 border border-indigo-400/30 rounded">v2.4 AI</span>
              </div>
              <p className="text-[11px] text-slate-500">Autonomous predictive failure engine bypasses scheduling friction</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Gemini Core Active</span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-white/10"></div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Google Sync: <span className="text-indigo-400 font-medium font-sans">Calendar & Tasks</span></span>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                SS
              </div>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 text-white text-xs font-medium rounded-xl transition duration-200"
              id="register-new-goal-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              Watch New Goal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* Predictive AI Core Section at top of the dashboard */}
        <FailureForecast deadlines={deadlines} preferences={preferences} />

        <InterventionCenter 
          deadlines={deadlines} 
          preferences={preferences} 
          onApplyIntervention={handleApplyIntervention} 
        />

        <AutonomousInterventionEngine
          deadlines={deadlines}
          preferences={preferences}
          onApplyIntervention={handleApplyIntervention}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Active Surveillance Board */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4.5 h-4.5 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Patrol Surveillance Board</h2>
              </div>
              <span className="text-xs font-mono text-slate-500 font-bold">{deadlines.length} Active Goals</span>
            </div>

            {deadlines.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl p-6">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-300">No deadlines registered or imported</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Protect yourself from academic failures! Initialize a goal using the &apos;Watch New Goal&apos; dialog or pull events from Calendar sidebar.
                </p>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-400 text-xs font-semibold rounded-xl border border-indigo-900 transition"
                >
                  Watch New Goal
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {deadlines.map((dl) => (
                  <DeadlineCard
                    key={dl.id}
                    deadline={dl}
                    onToggleSubtask={handleToggleSubtask}
                    onTriggerRecovery={handleTriggerRecovery}
                    onDelete={handleDeleteDeadline}
                    isRecovering={recoveringIds.includes(dl.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Co-pilot Intelligence & System Configuration */}
          <div className="lg:col-span-5 space-y-8">
            {/* 1. Today's Chrono-Plan & Habits */}
            <TodayActionPlan 
              deadlines={deadlines} 
              preferences={preferences} 
              onToggleSubtask={handleToggleSubtask}
            />

            {/* 2. Google Workspace Sandbox Simulator */}
            <GoogleSyncPanel 
              onImportDeadline={handleImportDeadline} 
              onImportTask={handleImportTask}
              deadlines={deadlines}
            />

            {/* 3. Procrastination Blocker Diagnoser Chat widget */}
            <BlockerDiagnoser 
              deadlines={deadlines} 
              onAddDiagnosis={handleAddDiagnosis}
            />

            {/* 4. Bio-energy parameters settings */}
            <EnergyConfig 
              preferences={preferences} 
              onUpdate={handleUpdatePreferences}
            />
          </div>

        </div>

        <div className="w-full h-px bg-slate-900/50 my-10 border-t border-dashed border-slate-900"></div>

        {/* Future Simulators & Experience Audits */}
        <OutcomeSimulator deadlines={deadlines} preferences={preferences} />

        <div className="w-full h-px bg-slate-900/50 my-10 border-t border-dashed border-slate-900"></div>

        <GuardianMemory deadlines={deadlines} preferences={preferences} />

      </main>

      {/* Add Deadline Dialog */}
      {isAddOpen && (
        <AddDeadlineModal 
          onAdd={handleAddDeadline} 
          onClose={() => setIsAddOpen(false)}
        />
      )}

      {/* Page Footer */}
      <footer className="border-t border-slate-950 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-600">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Deadline Guardian Patrol — Secure Academic Co-Pilot.
          </p>
          <p className="mt-2 sm:mt-0 font-mono">
            Circadian Engine Live • API Status: Connected
          </p>
        </div>
      </footer>
    </div>
  );
}
