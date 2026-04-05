/**
 * Logger Implementation
 *
 * Structured logging for production systems
 */

import type { Logger } from './types';

/**
 * Log level
 */
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger entry
 */
interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Logger implementation
 */
export class DefaultLogger implements Logger {
  private minLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(minLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.minLevel = LogLevel[minLevel.toUpperCase() as keyof typeof LogLevel];
  }

  /**
   * Debug log
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('DEBUG', LogLevel.DEBUG, message, context);
  }

  /**
   * Info log
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('INFO', LogLevel.INFO, message, context);
  }

  /**
   * Warn log
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('WARN', LogLevel.WARN, message, context);
  }

  /**
   * Error log
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'ERROR',
      message,
      context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    if (this.minLevel <= LogLevel.ERROR) {
      console.error(`[${entry.timestamp.toISOString()}] ERROR: ${message}`, {
        context,
        error: error?.message,
      });
    }

    this.store(entry);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: 'debug' | 'info' | 'warn' | 'error'): LogEntry[] {
    const levelStr = level.toUpperCase();
    return this.logs.filter((log) => log.level === levelStr);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportJSON(): unknown {
    return {
      logs: this.logs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        context: log.context,
        error: log.error,
      })),
      totalCount: this.logs.length,
    };
  }

  /**
   * Private: Log entry
   */
  private log(
    level: string,
    levelValue: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    if (this.minLevel <= levelValue) {
      const emoji: Record<string, string> = {
        DEBUG: '🔍',
        INFO: 'ℹ️',
        WARN: '⚠️',
        ERROR: '❌',
      };

      console.log(
        `[${entry.timestamp.toISOString()}] ${emoji[level]} ${level}: ${message}`,
        context ? context : ''
      );
    }

    this.store(entry);
  }

  /**
   * Private: Store log entry
   */
  private store(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

/**
 * No-op logger for testing
 */
export class NoOpLogger implements Logger {
  debug(_message: string, _context?: Record<string, unknown>): void {
    // No-op
  }

  info(_message: string, _context?: Record<string, unknown>): void {
    // No-op
  }

  warn(_message: string, _context?: Record<string, unknown>): void {
    // No-op
  }

  error(
    _message: string,
    _error?: Error,
    _context?: Record<string, unknown>
  ): void {
    // No-op
  }
}
