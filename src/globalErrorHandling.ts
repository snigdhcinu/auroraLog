import { Logger, GlobalErrorHandlingOptions } from './types.js';

// Singleton state to prevent duplicate global listeners
// Multiple setups are idempotent - only one set of listeners is installed
let globalErrorHandlingSetup = false;
let currentCleanupFunction: (() => void) | null = null;

const DEFAULT_EXIT_DELAY_MS = 100;

/**
 * Checks if we're in a Node.js environment (process exists).
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && process !== null && typeof process.on === 'function';
}

/**
 * Attempts to flush transports if they support it.
 */
function attemptFlush(logger: Logger): void {
  try {
    // Feature-detect transport.flush() - this will be available in future transports
    // For now, console transport doesn't need flushing, but we support it for future transports
    // @ts-expect-error - flush may not exist on all transports
    if (typeof logger.flush === 'function') {
      // @ts-expect-error
      logger.flush();
    }
  } catch {
    // Ignore flush errors
  }
}

/**
 * Sets up global error handling hooks.
 * 
 * Features:
 * - Environment-safe (no-op in non-Node environments)
 * - Idempotent (singleton pattern, prevents duplicate listeners)
 * - Handles uncaughtException (fatal level)
 * - Handles unhandledRejection (error level)
 * - Optional exit with delay and flush
 * 
 * @param logger - Logger instance to use for error logging
 * @param options - Global error handling options
 * @returns Cleanup function to remove listeners (no-op if not in Node environment)
 */
export function setupGlobalErrorHandling(
  logger: Logger,
  options: GlobalErrorHandlingOptions,
): () => void {
  // Environment safety: no-op if not in Node environment
  if (!isNodeEnvironment()) {
    return () => {
      // No-op cleanup
    };
  }

  // Idempotency: prevent duplicate setup
  // If already setup, return no-op cleanup (first setup remains active)
  if (globalErrorHandlingSetup) {
    return () => {
      // No-op: first setup remains active
    };
  }

  const captureUncaught = options.captureUncaughtException ?? false;
  const captureUnhandled = options.captureUnhandledRejection ?? false;
  const exitOnFatal = options.exitOnFatal ?? (captureUncaught ? true : false);
  const exitDelayMs = options.exitDelayMs ?? DEFAULT_EXIT_DELAY_MS;

  // Store original handlers for cleanup
  const originalUncaughtException = process.listeners('uncaughtException');
  const originalUnhandledRejection = process.listeners('unhandledRejection');

  // Uncaught exception handler
  const uncaughtExceptionHandler = (error: Error) => {
    try {
      const errorData: Record<string, unknown> = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
      if ('cause' in error && error.cause !== undefined) {
        errorData.cause = (error as { cause?: unknown }).cause;
      }
      logger.fatal('Uncaught exception', {
        error: errorData,
      });

      // Attempt flush before exit
      attemptFlush(logger);

      // Exit if configured (only if capture was enabled)
      if (exitOnFatal && captureUncaught) {
        setTimeout(() => {
          process.exit(1);
        }, exitDelayMs);
      }
    } catch {
      // Never throw from error handler; if logging fails, proceed with exit
      if (exitOnFatal && captureUncaught) {
        setTimeout(() => {
          process.exit(1);
        }, exitDelayMs);
      }
    }
  };

  // Unhandled rejection handler
  const unhandledRejectionHandler = (reason: unknown, promise: Promise<unknown>) => {
    try {
      const errorMetadata: Record<string, unknown> = {};

      if (reason instanceof Error) {
        const errorData: Record<string, unknown> = {
          message: reason.message,
          stack: reason.stack,
          name: reason.name,
        };
        if ('cause' in reason && reason.cause !== undefined) {
          errorData.cause = (reason as { cause?: unknown }).cause;
        }
        errorMetadata.error = errorData;
      } else {
        errorMetadata.reason = reason;
      }

      errorMetadata.promise = promise;

      logger.error('Unhandled promise rejection', errorMetadata);
    } catch {
      // Never throw from error handler
    }
  };

  // Install handlers
  if (captureUncaught) {
    process.on('uncaughtException', uncaughtExceptionHandler);
  }

  if (captureUnhandled) {
    process.on('unhandledRejection', unhandledRejectionHandler);
  }

  globalErrorHandlingSetup = true;

  // Create cleanup function
  currentCleanupFunction = () => {
    if (!isNodeEnvironment()) {
      return;
    }

    if (captureUncaught) {
      process.removeListener('uncaughtException', uncaughtExceptionHandler);
      // Restore original listeners if any
      originalUncaughtException.forEach((listener) => {
        process.on('uncaughtException', listener as (error: Error) => void);
      });
    }

    if (captureUnhandled) {
      process.removeListener('unhandledRejection', unhandledRejectionHandler);
      // Restore original listeners if any
      originalUnhandledRejection.forEach((listener) => {
        process.on('unhandledRejection', listener as (reason: unknown, promise: Promise<unknown>) => void);
      });
    }

    globalErrorHandlingSetup = false;
    currentCleanupFunction = null;
  };

  return currentCleanupFunction;
}

