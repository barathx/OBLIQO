export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ObligationStatus = 'Pending' | 'Completed';
export type Source = 'Telegram' | 'Gmail' | 'Document' | 'Calendar' | 'Manual';
export interface Obligation {
  id: string; title: string; category: string; amount: number; dueDate: string;
  priority: Priority; recurrence: string; source: Source; status: ObligationStatus;
  createdAt: string; description: string; reminder?: boolean; reminderDaysBefore?: number;
}
export interface FutureFund { id: string; obligationId?: string; title: string; target: number; prepared: number; monthsRemaining: number; status: 'Planning' | 'Active' | 'Completed' }
export interface ShieldCommitment { id: string; obligationId: string; consequence: number; commitment: number; status: 'Inactive' | 'Active' | 'Closed' }
export interface Notification { id: string; title: string; message: string; time: string; read: boolean; obligationId?: string; type?: string }
export interface ReminderRecord { id: string; obligationId: string; remindAt: string; daysBefore?: number; status: 'PENDING' | 'SENT' | 'CANCELLED' }
export interface ActivityEvent { id: string; title: string; detail?: string; time: string; obligationId?: string; kind: 'detected' | 'priority' | 'fund' | 'reminder' | 'shield' | 'completed' }
export type ConnectedSource = Exclude<Source,'Manual'>;
export interface SourceMessage { id: string; obligationId: string; source: ConnectedSource; sender: string; timestamp: string; content: string }
export interface DetectionResult { obligationId: string; detectedAt: string; extractedFields: string[]; confidence: number; processingSteps: string[] }
export interface SourceStatus { source: ConnectedSource; status: 'Connected' | 'Coming soon' }
export interface ScanSummary { scannedAt: string; detected: number; bySource: Partial<Record<ConnectedSource, number>>; obligationIds: string[] }
export interface ReminderSettings { daysBefore: number }
