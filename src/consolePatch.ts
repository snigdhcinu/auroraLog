import { Logger, ConsoleMethod, LogLevelName, LogMetadata, ConsoleLike, PatchConsoleOptions } from './types.js';

// Store original console methods for restoration
let originalConsole: {
  log?: typeof console.log;
  info?: typeof console.info;
  warn?: typeof console.warn;
  error?: typeof console.error;
  debug?: typeof console.debug;
  trace?: typeof console.trace;
} | null = null;

let isPatched = false;

/**
 * Default mapping of console methods to log levels.
 */
const DEFAULT_CONSOLE_MAP: Record<ConsoleMethod, LogLevelName> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
  trace: 'trace',
};

/**
 * Gets the original console (for use in transports to prevent recursion).
 * Returns the original console methods if patched, otherwise returns the current console.
 * 
 * Note: When console is patched, loggers should use the original console to prevent recursion.
 * Pass the result of this function to logger options: `createLogger({ console: getOriginalConsole() })`
 */
export function getOriginalConsole(): ConsoleLike {
  const orig = originalConsole;
  if (orig && isPatched) {
    // Return original console methods wrapped in a ConsoleLike object
    return {
      log: orig.log?.bind(console) ?? console.log,
      info: orig.info?.bind(console) ?? console.info,
      warn: orig.warn?.bind(console) ?? console.warn,
      error: orig.error?.bind(console) ?? console.error,
      debug: orig.debug?.bind(console) ?? console.debug,
      trace: orig.trace?.bind(console) ?? console.trace,
    };
  }
  // Not patched, return current console
  return console;
}

/**
 * Converts console arguments to structured log format.
 * 
 * Rules:
 * - First string argument becomes message
 * - If no string argument, message defaults to "console.<method>"
 * - Error objects extracted into structured error field (message, stack, cause)
 * - All raw arguments preserved under `consoleArgs` metadata field
 */
function convertConsoleArgs(args: unknown[]): { message: string; metadata?: LogMetadata } {
  let message = '';
  const metadata: LogMetadata = {
    consoleArgs: args,
  };

  // Find first string argument as message
  for (const arg of args) {
    if (typeof arg === 'string') {
      message = arg;
      break;
    }
  }

  // Extract error objects
  const errors: unknown[] = [];
  for (const arg of args) {
    if (arg instanceof Error) {
      const errorData: Record<string, unknown> = {
        message: arg.message,
        stack: arg.stack,
        name: arg.name,
      };
      if ('cause' in arg && arg.cause !== undefined) {
        errorData.cause = (arg as { cause?: unknown }).cause;
      }
      errors.push(errorData);
    }
  }

  if (errors.length > 0) {
    metadata.error = errors.length === 1 ? errors[0] : errors;
  }

  // Default message if no string found
  if (!message) {
    message = 'console.log'; // Will be overridden by caller with actual method name
  }

  return { message, metadata };
}

/**
 * Patches console methods to route through the logger.
 * 
 * Features:
 * - Idempotent (multiple patches don't create nested patches)
 * - Recursion prevention (uses original console in transport)
 * - Custom method-to-level mapping
 * - Variadic argument handling
 * - Cleanup function to restore original console
 * 
 * @param options - Patch console options
 * @returns Cleanup function to restore original console methods
 */
export function patchConsole(options: PatchConsoleOptions): () => void {
  const { logger, methods, map } = options;

  // Idempotent: if already patched, return no-op cleanup
  if (isPatched) {
    return () => {
      // No-op: console remains patched
    };
  }

  // Store original console methods (only once)
  originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace,
  };

  // Determine which methods to patch (default: all)
  const methodsToPatch: ConsoleMethod[] = methods ?? ['log', 'info', 'warn', 'error', 'debug', 'trace'];

  // Create patched methods
  const createPatchedMethod = (method: ConsoleMethod) => {
    return (...args: unknown[]) => {
      try {
        const level = map?.[method] ?? DEFAULT_CONSOLE_MAP[method];
        const { message, metadata } = convertConsoleArgs(args);
        // Update message with actual method name if it was defaulted
        const finalMessage = message === 'console.log' ? `console.${method}` : message;

        // Call logger method (which uses transport, which uses original console - no recursion)
        logger[level](finalMessage, metadata);
      } catch {
        // Never throw from console patch; fall back to original console
        const orig = originalConsole;
        if (orig) {
          const original = orig[method];
          if (original) {
            original.apply(console, args);
          }
        }
      }
    };
  };

  // Patch methods
  for (const method of methodsToPatch) {
    if (method in DEFAULT_CONSOLE_MAP) {
      (console as unknown as Record<string, unknown>)[method] = createPatchedMethod(method);
    }
  }

  isPatched = true;

  // Return cleanup function
  const cleanup = () => {
    const orig = originalConsole;
    if (!orig) {
      return;
    }

    // Restore original methods exactly
    if (orig.log !== undefined) console.log = orig.log;
    if (orig.info !== undefined) console.info = orig.info;
    if (orig.warn !== undefined) console.warn = orig.warn;
    if (orig.error !== undefined) console.error = orig.error;
    if (orig.debug !== undefined) console.debug = orig.debug;
    if (orig.trace !== undefined) console.trace = orig.trace;

    originalConsole = null;
    isPatched = false;
  };

  return cleanup;
}

