import React, { useState } from 'react';
import { GoogleCalendarEvent, GoogleTaskItem, Deadline } from '../types';
import { Calendar, CheckSquare, RefreshCw, Plus, Check, Globe, HelpCircle } from 'lucide-react';

interface GoogleSyncPanelProps {
  onImportDeadline: (event: GoogleCalendarEvent) => void;
  onImportTask: (task: GoogleTaskItem) => void;
  deadlines: Deadline[];
}

export default function GoogleSyncPanel({ onImportDeadline, onImportTask, deadlines }: GoogleSyncPanelProps) {
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleTasks, setGoogleTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks'>('calendar');
  const [syncedIds, setSyncedIds] = useState<string[]>([]);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const fetchGoogleData = async () => {
    setIsLoading(true);
    try {
      const calRes = await fetch('/api/google/calendar-events');
      const taskRes = await fetch('/api/google/tasks');
      if (calRes.ok && taskRes.ok) {
        const calData = await calRes.json();
        const taskData = await taskRes.json();
        setCalendarEvents(calData.events || []);
        setGoogleTasks(taskData.tasks || []);
      }
    } catch (e) {
      console.error("Failed to load simulated Google data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncItem = (item: GoogleCalendarEvent | GoogleTaskItem, type: 'calendar' | 'tasks') => {
    if (syncedIds.includes(item.id)) return;
    setSyncedIds(prev => [...prev, item.id]);
    if (type === 'calendar') {
      onImportDeadline(item as GoogleCalendarEvent);
    } else {
      onImportTask(item as GoogleTaskItem);
    }
  };

  const syncSubtasksToGoogle = async (deadline: Deadline) => {
    setIsLoading(true);
    setExportMessage(null);
    let successCount = 0;
    try {
      for (const t of deadline.subtasks) {
        const res = await fetch('/api/google/add-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `[Guardian] ${deadline.title} - ${t.title}`,
            notes: `Estimated Time: ${t.estimatedHours} hours. Recommended completion date: ${t.recommendedDate}. Required Energy: ${t.energyRequired}.`,
            due: t.recommendedDate
          })
        });
        if (res.ok) {
          successCount++;
        }
      }
      setExportMessage(`Successfully exported ${successCount} tasks to Google Tasks!`);
      setTimeout(() => setExportMessage(null), 5000);
    } catch (e) {
      console.error(e);
      setExportMessage('Sync failed. Please check network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden" id="google-sync-panel">
      {/* Background spot */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Google Workspace Sync
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulated sandbox environment context. Fetch real system deadlines & feed them into Guardian.
          </p>
        </div>
        <button
          onClick={fetchGoogleData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-500 text-white text-sm font-medium rounded-xl transition duration-200 shadow-md"
          id="fetch-google-btn"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Load Deadlines & Tasks
        </button>
      </div>

      <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 mb-4 relative z-10">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition duration-200 ${activeTab === 'calendar' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Google Calendar Events
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition duration-200 ${activeTab === 'tasks' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Google Tasks
        </button>
      </div>

      {isLoading && (
        <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span className="text-xs">Querying Google services...</span>
        </div>
      )}

      {!isLoading && calendarEvents.length === 0 && googleTasks.length === 0 && (
        <div className="py-12 text-center rounded-xl border border-dashed border-slate-800/60 flex flex-col items-center justify-center p-4">
          <Calendar className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-400">No synced items pulled yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Press &apos;Load Deadlines &amp; Tasks&apos; above to simulate fetching deadlines directly from your classes!
          </p>
        </div>
      )}

      {!isLoading && activeTab === 'calendar' && calendarEvents.length > 0 && (
        <div className="space-y-3 relative z-10">
          {calendarEvents.map((event) => (
            <div key={event.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 self-start">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white line-clamp-1">{event.summary}</h4>
                  {event.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{event.description}</p>}
                  <span className="inline-block px-2 py-0.5 mt-2 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono rounded border border-indigo-500/25">
                    Due: {event.start.dateTime ? new Date(event.start.dateTime).toLocaleDateString() : event.start.date}
                  </span>
                </div>
              </div>
              <button
                disabled={syncedIds.includes(event.id)}
                onClick={() => handleSyncItem(event, 'calendar')}
                className={`p-2 rounded-lg transition-all ${syncedIds.includes(event.id) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-500 hover:text-white'}`}
              >
                {syncedIds.includes(event.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeTab === 'tasks' && googleTasks.length > 0 && (
        <div className="space-y-3 relative z-10">
          {googleTasks.map((task) => (
            <div key={task.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 self-start">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white line-clamp-1">{task.title}</h4>
                  {task.notes && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.notes}</p>}
                  {task.due && (
                    <span className="inline-block px-2 py-0.5 mt-2 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/25">
                      Due: {new Date(task.due).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                disabled={syncedIds.includes(task.id)}
                onClick={() => handleSyncItem(task, 'tasks')}
                className={`p-2 rounded-lg transition-all ${syncedIds.includes(task.id) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
              >
                {syncedIds.includes(task.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {deadlines.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
          <span className="text-xs font-semibold text-slate-300 block mb-2">Export active plans to Google Tasks:</span>
          {exportMessage && (
            <div className="mb-3 px-3 py-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-450 text-xs rounded-xl">
              {exportMessage}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {deadlines.map((dl) => (
              <button
                key={dl.id}
                onClick={() => syncSubtasksToGoogle(dl)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                {dl.title.length > 18 ? `${dl.title.substring(0, 18)}...` : dl.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
