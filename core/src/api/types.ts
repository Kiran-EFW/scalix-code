/**
 * API Types
 *
 * REST and WebSocket API definitions.
 */

/**
 * HTTP response envelope
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: Date;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  type: string;
  id: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Request context
 */
export interface RequestContext {
  userId?: string;
  tenantId?: string;
  requestId: string;
  traceId: string;
  timestamp: Date;
}
