/**
 * Obliqo service layer — Phase 6 real backend integration.
 *
 * All functionality has moved to apiClient.ts.
 * This file re-exports everything so existing imports from '@/services/api' continue to work.
 */
export {
  api,
  subscribe,
  getSnapshot,
  getServerSnapshot,
  hydrateDemoState,
  SCAN_STEPS,
  DETECTION_STEPS,
} from './apiClient';
export type { AppSnapshot } from './apiClient';
