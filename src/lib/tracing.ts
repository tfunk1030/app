/**
 * Distributed Tracing Utilities
 *
 * Provides request ID propagation and trace context for debugging
 * across async operations and API calls.
 */

import { v4 as uuidv4 } from 'uuid';

// Current trace context (stored per-request in async context)
// Note: This uses module-level state which is not safe for concurrent async operations.
// For production use with high concurrency, consider using AsyncLocalStorage or React context.
let currentTraceId: string | null = null;
let currentSpanId: string | null = null;

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: number;
}

export interface TraceHeaders {
  'x-trace-id': string;
  'x-span-id': string;
  'x-request-id': string;
}

/**
 * Generate a new trace ID (used at request boundary)
 */
export function generateTraceId(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Generate a new span ID (used for each operation)
 */
export function generateSpanId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 16);
}

/**
 * Start a new trace (call at app entry points)
 */
export function startTrace(): TraceContext {
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  currentTraceId = traceId;
  currentSpanId = spanId;

  return {
    traceId,
    spanId,
    startTime: Date.now(),
  };
}

/**
 * Start a child span within current trace
 */
export function startSpan(name: string): TraceContext {
  const traceId = currentTraceId || generateTraceId();
  const parentSpanId = currentSpanId;
  const spanId = generateSpanId();

  currentSpanId = spanId;

  if (__DEV__) {
    console.debug(`[TRACE] Starting span: ${name}`, { traceId, spanId, parentSpanId });
  }

  return {
    traceId,
    spanId,
    parentSpanId: parentSpanId || undefined,
    startTime: Date.now(),
  };
}

/**
 * End a span and log duration
 */
export function endSpan(context: TraceContext, name: string, success = true): void {
  const duration = Date.now() - context.startTime;

  if (__DEV__) {
    console.debug(`[TRACE] Ended span: ${name}`, {
      traceId: context.traceId,
      spanId: context.spanId,
      duration: `${duration}ms`,
      success,
    });
  }

  // Restore parent span
  if (context.parentSpanId) {
    currentSpanId = context.parentSpanId;
  }
}

/**
 * Get current trace context
 */
export function getCurrentTrace(): { traceId: string | null; spanId: string | null } {
  return {
    traceId: currentTraceId,
    spanId: currentSpanId,
  };
}

/**
 * Get headers to propagate trace context to API calls
 */
export function getTraceHeaders(): TraceHeaders {
  const traceId = currentTraceId || generateTraceId();
  const spanId = currentSpanId || generateSpanId();

  return {
    'x-trace-id': traceId,
    'x-span-id': spanId,
    'x-request-id': traceId, // Alias for compatibility
  };
}

/**
 * Wrap an async function with tracing
 */
export function withTracing<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = startSpan(name);

  return fn()
    .then((result) => {
      endSpan(span, name, true);
      return result;
    })
    .catch((error) => {
      endSpan(span, name, false);
      throw error;
    });
}

/**
 * Create a traced fetch wrapper
 */
export function createTracedFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const span = startSpan(`fetch:${typeof input === 'string' ? input : input.toString()}`);
    const headers = getTraceHeaders();

    const tracedInit: RequestInit = {
      ...init,
      headers: {
        ...init?.headers,
        ...headers,
      },
    };

    try {
      const response = await baseFetch(input, tracedInit);
      endSpan(span, 'fetch', response.ok);
      return response;
    } catch (error) {
      endSpan(span, 'fetch', false);
      throw error;
    }
  };
}

/**
 * Reset trace context (call between independent operations)
 */
export function resetTrace(): void {
  currentTraceId = null;
  currentSpanId = null;
}
