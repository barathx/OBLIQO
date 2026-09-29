/**
 * Obliqo Real API Client — Phase 6
 *
 * Replaces the in-memory mock store with real HTTP calls to the backend.
 * All field mapping (DB enum formats ↔ frontend string formats) is done here
 * so the rest of the app (pages, hooks) does not need to change.
 *
 * Backend:  http://localhost:3000
 * DB enums: PENDING, COMPLETED, HIGH, CRITICAL, GMAIL, TELEGRAM, …
 * Frontend: Pending, Completed, High, Critical, Gmail, Telegram, …
 */

import type {
  Obligation,
  FutureFund,
  ShieldCommitment,
  Notification,
  ActivityEvent,
  SourceMessage,
  ReminderSettings,
  ScanSummary,
  Priority,
  Source,
} from '@/types/obligation';

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = (await res.json()) as { success: boolean; data?: T; message?: string };
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? `API error ${res.status}`);
  }
  return json.data as T;
}

// ─── Field mappers ─────────────────────────────────────────────────────────────

function mapPriority(raw: string): Priority {
  const map: Record<string, Priority> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };
  return map[raw] ?? 'Medium';
}

function mapSource(raw: string): Source {
  const map: Record<string, Source> = {
    GMAIL: 'Gmail',
    TELEGRAM: 'Telegram',
    CALENDAR: 'Calendar',
    DOCUMENT: 'Document',
    MANUAL: 'Manual',
  };
  return map[raw] ?? 'Manual';
}

function toDbPriority(p: Priority): string {
  return p.toUpperCase();
}

function toDbSource(s: Source): string {
  return s.toUpperCase();
}

function mapCategory(raw: string): string {
  const map: Record<string, string> = {
    INSURANCE: 'Insurance',
    BILL: 'Utilities',
    SUBSCRIPTION: 'Subscriptions',
    DOCUMENT: 'Documents',
    TAX: 'Tax',
    APPOINTMENT: 'Appointments',
    SERVICE: 'Vehicle',
    EDUCATION: 'Education',
    OTHER: 'Other',
  };
  return map[raw] ?? raw;
}

function toDbCategory(c: string): string {
  const map: Record<string, string> = {
    Insurance: 'INSURANCE',
    Utilities: 'BILL',
    Subscriptions: 'SUBSCRIPTION',
    Documents: 'DOCUMENT',
    Tax: 'TAX',
    Appointments: 'APPOINTMENT',
    Vehicle: 'SERVICE',
    Education: 'EDUCATION',
    Housing: 'OTHER',
    Warranty: 'OTHER',
    Other: 'OTHER',
  };
  return map[c] ?? 'OTHER';
}

function mapRecurrence(raw: string): string {
  const map: Record<string, string> = {
    NONE: 'One-time',
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
    CUSTOM: 'Custom',
  };
  return map[raw] ?? 'One-time';
}

function toDbRecurrence(r: string): string {
  const map: Record<string, string> = {
    'One-time': 'NONE',
    Daily: 'DAILY',
    Weekly: 'WEEKLY',
    Monthly: 'MONTHLY',
    Quarterly: 'MONTHLY',
    Yearly: 'YEARLY',
    Custom: 'CUSTOM',
  };
  return map[r] ?? 'NONE';
}

// ─── DB → Frontend shape converters ──────────────────────────────────────────

function toObligation(raw: any): Obligation {
  const deadline: string | null = raw.deadline
    ? new Date(raw.deadline).toISOString().slice(0, 10)
    : null;

  const status: 'Pending' | 'Completed' =
    raw.status === 'COMPLETED' ? 'Completed' : 'Pending';

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    category: mapCategory(raw.category ?? 'OTHER'),
    amount: raw.amount ? Number(raw.amount) : 0,
    dueDate: deadline ?? '',
    priority: mapPriority(raw.priority ?? 'MEDIUM'),
    recurrence: mapRecurrence(raw.recurrence ?? 'NONE'),
    source: mapSource(raw.source ?? 'MANUAL'),
    status,
    createdAt: raw.createdAt
      ? new Date(raw.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    reminder: Array.isArray(raw.reminders) && raw.reminders.length > 0,
    reminderDaysBefore:
      Array.isArray(raw.reminders) && raw.reminders.length > 0
        ? raw.reminders[0].daysBefore ?? 1
        : undefined,
  };
}

function toActivity(raw: any): ActivityEvent {
  const kindMap: Record<string, ActivityEvent['kind']> = {
    OBLIGATION_DETECTED: 'detected',
    OBLIGATION_UPDATED: 'detected',
    OBLIGATION_ARCHIVED: 'detected',
    PRIORITY_UPDATED: 'priority',
    REMINDER_CREATED: 'reminder',
    OBLIGATION_COMPLETED: 'completed',
    SCAN_STARTED: 'detected',
    SCAN_COMPLETED: 'detected',
    SCAN_FAILED: 'detected',
  };
  return {
    id: raw.id,
    title: raw.title,
    detail: raw.description,
    time: formatTimeAgo(raw.createdAt),
    obligationId: raw.obligationId ?? undefined,
    kind: kindMap[raw.type] ?? 'detected',
  };
}

function toNotification(raw: any): Notification {
  return {
    id: raw.id,
    title: raw.title,
    message: raw.message,
    time: formatTimeAgo(raw.createdAt),
    read: raw.isRead ?? false,
    obligationId: raw.obligationId ?? undefined,
    type: raw.type ?? 'REMINDER',
  };
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return `Today · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  if (diffHours < 48)
    return `Yesterday · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── AppSnapshot ──────────────────────────────────────────────────────────────

export interface AppSnapshot {
  obligations: Obligation[];
  funds: FutureFund[];
  shields: ShieldCommitment[];
  notifications: Notification[];
  activity: ActivityEvent[];
  messages: SourceMessage[];
  lastScan: ScanSummary;
}

const DEFAULT_SCAN: ScanSummary = {
  scannedAt: 'Never',
  detected: 0,
  bySource: {},
  obligationIds: [],
};

// ─── Reactive store ────────────────────────────────────────────────────────────

let state: AppSnapshot = {
  obligations: [],
  funds: [],
  shields: [],
  notifications: [],
  activity: [],
  messages: [],
  lastScan: DEFAULT_SCAN,
};

const listeners = new Set<() => void>();

function emit(next: Partial<AppSnapshot>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getSnapshot = () => state;
export const getServerSnapshot = () => state;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

let pollTimer: any = null;

export async function hydrateDemoState() {
  try {
    const [oblRes, notifRes, actRes] = await Promise.allSettled([
      request<any>('/api/obligations?limit=200&sortBy=deadline&sortOrder=asc'),
      request<any[]>('/api/notifications'),
      request<any[]>('/api/activity'),
    ]);

    const obligations =
      oblRes.status === 'fulfilled'
        ? oblRes.value.obligations.map(toObligation)
        : [];

    const notifications =
      notifRes.status === 'fulfilled' ? notifRes.value.map(toNotification) : [];

    const activity =
      actRes.status === 'fulfilled' ? actRes.value.map(toActivity) : [];

    emit({ obligations, notifications, activity });

    // Start background poll every 10s if not already running
    if (!pollTimer && typeof window !== 'undefined') {
      pollTimer = setInterval(() => {
        hydrateDemoState();
      }, 10000);
    }
  } catch {
    // Backend unavailable — keep empty state; UI gracefully shows empty lists
  }
}

// ─── Static source status (configured by n8n/backend) ────────────────────────

import { sourceStatus } from '@/data/mockData';

// ─── SCAN_STEPS / DETECTION_STEPS ─────────────────────────────────────────────

export const SCAN_STEPS = [
  'Reading connected sources...',
  'Understanding messages...',
  'Identifying obligations...',
  'Calculating priority...',
  'Preparing your workspace...',
];

export const DETECTION_STEPS = [
  'Message received',
  'Obligation identified',
  'Deadline identified',
  'Amount identified',
  'Priority calculated',
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Public API (same interface as mock api.ts) ────────────────────────────────

export const api = {
  getObligations: async () => {
    const data = await request<any>('/api/obligations?limit=200&sortBy=deadline&sortOrder=asc');
    const obligations = data.obligations.map(toObligation);
    emit({ obligations });
    return obligations as Obligation[];
  },

  getObligation: async (id: string) => {
    try {
      const data = await request<any>(`/api/obligations/${id}`);
      return toObligation(data) as Obligation;
    } catch {
      return state.obligations.find((o) => o.id === id);
    }
  },

  createObligation: async (data: Omit<Obligation, 'id' | 'createdAt' | 'status'>) => {
    const body = {
      title: data.title,
      description: data.description,
      category: toDbCategory(data.category),
      amount: data.amount,
      deadline: data.dueDate,
      priority: toDbPriority(data.priority),
      recurrence: toDbRecurrence(data.recurrence),
      source: toDbSource(data.source),
    };
    const created = await request<any>('/api/obligations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const obligation = toObligation(created);
    emit({ obligations: [obligation, ...state.obligations] });
    return obligation as Obligation;
  },

  updateObligation: async (id: string, data: Partial<Obligation>) => {
    const d = data as Record<string, unknown>;
    const body: Record<string, unknown> = {};
    if (d['title'] !== undefined) body['title'] = d['title'];
    if (d['description'] !== undefined) body['description'] = d['description'];
    if (d['category'] !== undefined) body['category'] = toDbCategory(d['category'] as string);
    if (d['amount'] !== undefined) body['amount'] = d['amount'];
    if (d['dueDate'] !== undefined) body['deadline'] = d['dueDate'];
    if (d['priority'] !== undefined) body['priority'] = toDbPriority(d['priority'] as Priority);
    if (d['recurrence'] !== undefined) body['recurrence'] = toDbRecurrence(d['recurrence'] as string);
    if (d['source'] !== undefined) body['source'] = toDbSource(d['source'] as Source);
    const updated = await request<any>(`/api/obligations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const obligation = toObligation(updated);
    emit({ obligations: state.obligations.map((o) => (o.id === id ? obligation : o)) });
  },

  completeObligation: async (id: string) => {
    await request<any>(`/api/obligations/${id}/complete`, { method: 'POST' });
    emit({
      obligations: state.obligations.map((o) =>
        o.id === id ? { ...o, status: 'Completed' as const } : o
      ),
    });
  },

  scheduleReminder: async (id: string, settings: ReminderSettings) => {
    await request<any>(`/api/obligations/${id}/reminder`, {
      method: 'POST',
      body: JSON.stringify({ daysBefore: settings.daysBefore }),
    });
    emit({
      obligations: state.obligations.map((o) =>
        o.id === id ? { ...o, reminder: true, reminderDaysBefore: settings.daysBefore } : o
      ),
    });
  },

  remindObligation: async (id: string) => api.scheduleReminder(id, { daysBefore: 1 }),

  getSourceStatus: async () => sourceStatus,

  getSourceMessage: async (obligationId: string) =>
    state.messages.find((m) => m.obligationId === obligationId),

  getDetection: (item: Obligation) =>
    item.source === 'Manual'
      ? undefined
      : {
          obligationId: item.id,
          detectedAt: item.createdAt,
          extractedFields: ['title', 'category', 'amount', 'deadline', 'recurrence', 'priority'],
          confidence: 0.94,
          processingSteps: DETECTION_STEPS,
        },

  scanSources: async (onStep?: (index: number) => void): Promise<ScanSummary> => {
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      onStep?.(i);
      await wait(850);
    }
    const data = await request<any>('/api/obligations?limit=200&sortBy=deadline&sortOrder=asc');
    const obligations = data.obligations.map(toObligation);
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const summary: ScanSummary = {
      scannedAt: `Today, ${time}`,
      detected: 0,
      bySource: {},
      obligationIds: [],
    };
    emit({ obligations, lastScan: summary });
    return summary;
  },

  getDashboard: async () => ({ obligations: state.obligations, funds: state.funds }),

  getFutureFunds: async () => state.funds,

  createFutureFund: async (data: Omit<FutureFund, 'id' | 'status'>) => {
    const item: FutureFund = { ...data, id: crypto.randomUUID(), status: 'Planning' };
    emit({ funds: [item, ...state.funds] });
    return item;
  },

  startFutureFund: async (id: string) => {
    emit({ funds: state.funds.map((f) => (f.id === id ? { ...f, status: 'Active' } : f)) });
  },

  getShields: async () => state.shields,

  activateShield: async (id: string) => {
    emit({ shields: state.shields.map((s) => (s.id === id ? { ...s, status: 'Active' } : s)) });
  },

  closeShield: async (id: string) => {
    emit({ shields: state.shields.map((s) => (s.id === id ? { ...s, status: 'Closed' } : s)) });
  },

  getActivity: async () => {
    const data = await request<any[]>('/api/activity');
    const activity = data.map(toActivity);
    emit({ activity });
    return activity as ActivityEvent[];
  },

  getNotifications: async () => {
    const data = await request<any[]>('/api/notifications');
    const notifications = data.map(toNotification);
    emit({ notifications });
    return notifications as Notification[];
  },

  markNotificationRead: async (id: string) => {
    await request<any>(`/api/notifications/${id}/read`, { method: 'PATCH' });
    emit({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    });
  },

  markAllNotificationsRead: async () => {
    await request<any>('/api/notifications/read-all', { method: 'PATCH' });
    emit({ notifications: state.notifications.map((n) => ({ ...n, read: true })) });
  },

  getReminders: async (obligationId?: string) => {
    const query = obligationId ? `?obligationId=${obligationId}` : '';
    return await request<any[]>(`/api/reminders${query}`);
  },

  deleteReminder: async (id: string) => {
    await request<any>(`/api/reminders/${id}`, { method: 'DELETE' });
  },
};
