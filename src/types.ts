export interface SubTask {
  id: string;
  title: string;
  estimatedHours: number;
  completed: boolean;
  recommendedDate: string; // YYYY-MM-DD
  energyRequired: 'high' | 'medium' | 'low';
  phase: 'research' | 'execution' | 'refinement' | 'review';
}

export interface BlockerDiagnosis {
  id: string;
  timestamp: string;
  type: 'perfectionism' | 'overwhelm' | 'lack_of_interest' | 'exhaustion' | 'unclear_steps';
  analysis: string;
  microStep: string; // Actionable 5-min micro-task to break the freeze
}

export interface RecoveryAction {
  id: string;
  originalTaskTitle: string;
  recoveredAction: string;
  priority: 'high' | 'critical';
  timeSavingMin: number;
}

export interface Deadline {
  id: string;
  title: string;
  description: string;
  targetDate: string; // ISO date string
  estimatedHours: number; // calculated total workload hours
  availableHoursPerDay: number; // user hours available per day
  currentProgress: number; // 0-100
  status: 'planning' | 'on_track' | 'high_risk' | 'critical' | 'completed';
  riskScore: number; // 0 - 100
  riskReason: string; // Gemini diagnosis of risk
  subtasks: SubTask[];
  blockerDiagnoses: BlockerDiagnosis[];
  recoveryHistory: {
    timestamp: string;
    reason: string;
    actions: RecoveryAction[];
    previousRiskScore: number;
  }[];
}

export interface UserPreferences {
  sleepStart: string; // "23:00"
  sleepEnd: string; // "07:00"
  peakEnergy: 'morning' | 'afternoon' | 'evening';
  sessionDuration: number; // default 50 mins
  bufferRatio: number; // 1.2 meaning 20% safety margin
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
}
