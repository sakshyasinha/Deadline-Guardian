import React from 'react';
import { UserPreferences } from '../types';
import { Sliders, Sun, Sunset, Moon, Zap, ShieldCheck } from 'lucide-react';

interface EnergyConfigProps {
  preferences: UserPreferences;
  onUpdate: (updated: UserPreferences) => void;
}

export default function EnergyConfig({ preferences, onUpdate }: EnergyConfigProps) {
  const handleChange = (key: keyof UserPreferences, value: any) => {
    onUpdate({
      ...preferences,
      [key]: value
    });
  };

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden" id="energy-config">
      {/* Background visual asset */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Bio-Energy & Habit Config</h2>
          <p className="text-xs text-slate-400 mt-0.5">Customize your circadian preferences to optimize autonomous suggestions.</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">CHRONOTYPE PEAK ENERGY STATE</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'morning', label: 'Morning Peak', desc: '08:00 - 12:00', icon: Sun, color: 'text-amber-400' },
              { id: 'afternoon', label: 'Afternoon Peak', desc: '13:00 - 17:00', icon: Sunset, color: 'text-orange-400' },
              { id: 'evening', label: 'Evening Peak', desc: '18:00 - 22:00', icon: Moon, color: 'text-indigo-400' }
            ].map((peak) => {
              const Icon = peak.icon;
              return (
                <button
                  key={peak.id}
                  onClick={() => handleChange('peakEnergy', peak.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${preferences.peakEnergy === peak.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black/30 border-white/10 hover:border-white/20'}`}
                  type="button"
                >
                  <Icon className={`w-5 h-5 mb-1 ${peak.color}`} />
                  <span className="text-xs font-bold text-white block">{peak.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">{peak.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">SLEEP WINDOW START</label>
            <input
              type="time"
              value={preferences.sleepStart}
              onChange={(e) => handleChange('sleepStart', e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-sans tracking-wider">SLEEP WINDOW END</label>
            <input
              type="time"
              value={preferences.sleepEnd}
              onChange={(e) => handleChange('sleepEnd', e.target.value)}
              className="w-full bg-black/40 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none transition"
            />
          </div>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-sans tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                POMODORO SESSION LENGTH
              </label>
              <span className="text-xs font-bold text-indigo-400">{preferences.sessionDuration} mins</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={preferences.sessionDuration}
              onChange={(e) => handleChange('sessionDuration', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
            />
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Energy scheduling maps highly demanding subtasks directly onto your peak <span className="font-semibold text-white capitalize">{preferences.peakEnergy}</span> window, ensuring you work when focus is chemically optimal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
