import React from 'react';
import { Deadline, SubTask, UserPreferences } from '../types';
import { Clock, Moon, Sparkles, Sun, Sunset, Zap, AlertCircle } from 'lucide-react';

interface TodayActionPlanProps {
  deadlines: Deadline[];
  preferences: UserPreferences;
  onToggleSubtask: (deadlineId: string, subtaskId: string) => void;
}

export default function TodayActionPlan({ deadlines, preferences, onToggleSubtask }: TodayActionPlanProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Gather subtasks scheduled for today, or the first 3 uncompleted subtasks across all goals if none are specifically today's date.
  const allIncomplete = deadlines
    .filter((d) => d.status !== 'completed')
    .flatMap((d) =>
      d.subtasks
        .filter((t) => !t.completed)
        .map((t) => ({ ...t, deadlineId: d.id, deadlineTitle: d.title }))
    );

  // Filter tasks that are recommended for today or scheduled next
  const todayTasks = allIncomplete.filter((t) => t.recommendedDate === todayStr || t.recommendedDate <= todayStr);
  
  // If no tasks are recommended for today or before, just take the top 3 undone actions to keep the dashboard actionable!
  const displayTasks = todayTasks.length > 0 ? todayTasks : allIncomplete.slice(0, 3);

  // Generate autonomous hourly plan based on preferred energy peaks and sleep window.
  // Morning peak: 09:00 - 12:00
  // Afternoon peak: 14:00 - 17:00
  // Evening peak: 19:00 - 22:00
  // Let's layout a visual calendar day of hourly blocks.
  const generateHourlySlots = () => {
    const slots = [];
    let peakStartHour = 9;
    if (preferences.peakEnergy === 'afternoon') peakStartHour = 14;
    if (preferences.peakEnergy === 'evening') peakStartHour = 19;

    const sleepHourStart = parseInt(preferences.sleepStart.split(':')[0]) || 23;
    const sleepHourEnd = parseInt(preferences.sleepEnd.split(':')[0]) || 7;

    for (let h = 8; h <= 23; h++) {
      const isSleep = h >= sleepHourStart || h < sleepHourEnd;
      const isPeak = h >= peakStartHour && h < peakStartHour + 3;
      let label = `${h}:00`;
      
      // Assign task if any matches this slot
      let assignedTask: any = null;
      if (!isSleep) {
        if (isPeak) {
          // peak slot: assign high energy tasks
          assignedTask = displayTasks.find(t => t.energyRequired === 'high') || displayTasks[0];
        } else {
          assignedTask = displayTasks.find(t => t.energyRequired !== 'high') || displayTasks[1] || displayTasks[0];
        }
      }

      slots.push({
        hour: h,
        label,
        isSleep,
        isPeak,
        task: assignedTask
      });
    }
    return slots;
  };

  const slots = generateHourlySlots();

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden" id="today-action-plan">
      {/* Visual background atmospheric elements */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Today&apos;s Energized Copilot Flow
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic hourly study schedules calculated using circadian bio-energy and sleep constraints.
          </p>
        </div>
        <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 rounded-full font-mono text-[10px] uppercase font-bold tracking-wider">
          {preferences.peakEnergy} FOCUS PEAK
        </span>
      </div>

      {displayTasks.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-white/10 p-4 relative z-10">
          <Moon className="w-8 h-8 text-indigo-500/50 mx-auto mb-2.5 animate-pulse" />
          <p className="text-sm font-semibold text-slate-300">Guardian Patrol Discharged - All Tasks Finished!</p>
          <p className="text-xs text-slate-500 mt-1">Excellent job preventing missing deadlines. Input or sync a new project to start again.</p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-200 leading-relaxed">
              <strong>Guardian Chrono-Tip:</strong> Your chemical prime focus window today is during the <span className="capitalize font-bold text-white">{preferences.peakEnergy}</span>. We highly recommend completing high-complexity deliverables in those exact hours.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {slots.map((slot) => {
              const isCurrentHour = new Date().getHours() === slot.hour;
              return (
                <div 
                   key={slot.hour} 
                   className={`flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 ${
                     isCurrentHour 
                       ? 'bg-indigo-500/15 border-indigo-500/40 shadow-lg shadow-indigo-600/5' 
                       : slot.isSleep 
                         ? 'bg-black/35 border-white/5 opacity-50' 
                         : 'bg-black/20 border-white/5'
                   }`}
                >
                  <div className="text-xs font-mono font-bold text-slate-400 w-12 shrink-0 pt-0.5 flex flex-col items-start gap-0.5">
                    <span>{slot.label}</span>
                    {isCurrentHour && (
                      <span className="px-1 py-0.5 bg-indigo-600 text-indigo-100 text-[8px] font-sans font-bold rounded animate-pulse">
                        NOW
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex items-start justify-between gap-3 min-w-0">
                    {slot.isSleep ? (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Moon className="w-4 h-4 shrink-0 text-slate-600" />
                        <span className="text-xs italic font-medium">Recharge Sleep Window (Do Not Schedule Work)</span>
                      </div>
                    ) : slot.task ? (
                      <div className="min-w-0">
                        <span className={`text-xs font-semibold block transition-colors ${isCurrentHour ? 'text-indigo-200 font-bold text-indigo-400' : 'text-slate-200'}`}>
                          {slot.isPeak ? '⚡ [Peak Session] ' : ''}{slot.task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[150px] font-semibold">
                            Goal: {slot.task.deadlineTitle}
                          </span>
                          <span className={`px-1.5 py-0.3 rounded text-[9px] font-mono ${slot.isPeak ? 'bg-indigo-950 text-indigo-400' : 'bg-white/5 text-slate-400'}`}>
                            {slot.task.energyRequired}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Discharge / Empty Buffer Block</span>
                    )}

                    {slot.task && !slot.isSleep && (
                      <button
                        onClick={() => onToggleSubtask(slot.task.deadlineId, slot.task.id)}
                        className="py-1 px-2 border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold font-mono transition shrink-0"
                      >
                        Check Off
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
