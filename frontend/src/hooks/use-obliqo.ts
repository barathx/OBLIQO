import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, getServerSnapshot } from '@/services/api';
export function useObliqo() { return useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot); }
