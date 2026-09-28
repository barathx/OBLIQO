import {
  ObligationStatus,
  Priority,
  ObligationCategory,
  ObligationSource,
  Recurrence,
} from '@prisma/client';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  duplicate?: boolean;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  obligations: T[];
  pagination: PaginationMeta;
}

export type DueFilter = 'today' | 'week' | 'month' | 'overdue';
export type SortByField = 'deadline' | 'amount' | 'priority' | 'createdAt' | 'updatedAt' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface ObligationQueryFilters {
  page: number;
  limit: number;
  search?: string;
  status?: ObligationStatus;
  priority?: Priority;
  category?: ObligationCategory;
  source?: ObligationSource;
  deadlineFrom?: Date;
  deadlineTo?: Date;
  due?: DueFilter;
  sortBy: SortByField;
  sortOrder: SortOrder;
}

export interface CreateObligationInput {
  title: string;
  description?: string;
  category?: ObligationCategory;
  amount?: number;
  currency?: string;
  deadline?: string | Date;
  priority?: Priority;
  recurrence?: Recurrence;
  source?: ObligationSource;
  sourceMessageId?: string;
}

export interface UpdateObligationInput {
  title?: string;
  description?: string;
  category?: ObligationCategory;
  amount?: number;
  currency?: string;
  deadline?: string | Date;
  priority?: Priority;
  recurrence?: Recurrence;
  status?: ObligationStatus;
  source?: ObligationSource;
}

export interface ObligationSummary {
  dueToday: number;
  dueThisWeek: number;
  upcoming: number;
  upcomingAmount: number;
}
