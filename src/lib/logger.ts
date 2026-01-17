/**
 * Structured Logger for AICaddy Pro
 *
 * Provides consistent, structured logging with levels, context, and sanitization.
 * Designed for React Native with production-safe defaults.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Patterns to redact from logs
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
];

const SENSITIVE_KEYS = new Set([
  'apiKey',
  'api_key',
  'password',
  'token',
  'secret',
  'authorization',
  'bearer',
  'credential',
  'accessToken',
  'refreshToken',
]);

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = __DEV__ ? 'debug' : 'info';
  private defaultContext: LogContext = {};

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // Check if value looks like a sensitive string
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(value)) {
          return '[REDACTED]';
        }
      }
      // Redact long alphanumeric strings that might be tokens
      if (/^[a-zA-Z0-9_-]{32,}$/.test(value)) {
        return '[REDACTED]';
      }
      return value;
    }
    return value;
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key) || SENSITIVE_PATTERNS.some((p) => p.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = this.sanitizeValue(value);
      }
    }

    return sanitized;
  }

  private formatEntry(entry: LogEntry): string {
    const sanitizedEntry = {
      ...entry,
      context: entry.context ? this.sanitizeObject(entry.context) : undefined,
    };
    return JSON.stringify(sanitizedEntry);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.defaultContext, ...context },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: __DEV__ ? error.stack : undefined,
      };
    }

    const formatted = this.formatEntry(entry);

    // In development, use console with colors
    if (__DEV__) {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m', // green
        warn: '\x1b[33m', // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      console[level === 'debug' ? 'log' : level](
        `${colors[level]}[${level.toUpperCase()}]${reset}`,
        message,
        context || ''
      );
    } else {
      // In production, output structured JSON
      // This can be picked up by log aggregation services
      console[level === 'debug' ? 'log' : level](formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    this.log('error', message, context, err);
  }

  // Create a child logger with additional context
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.context, ...context });
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, { ...this.context, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.context, ...context });
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.error(message, error, { ...this.context, ...context });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export for testing
export { Logger, ChildLogger };
