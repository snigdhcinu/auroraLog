import { ConsoleTransport } from './consoleTransport.js';
import { DEFAULT_LEVEL, shouldLog } from './levels.js';
import { ConsoleTransportOptions, LogLevelName, LogMetadata, Logger, LoggerOptions } from './types.js';

interface InternalLoggerOptions {
  level: LogLevelName;
  console: ConsoleTransportOptions;
}

export function createLogger(options?: LoggerOptions): Logger {
  const resolved: InternalLoggerOptions = {
    level: options?.level ?? DEFAULT_LEVEL,
    console: options?.console ?? {},
  };

  const transport = new ConsoleTransport(resolved.console);

  const log = (level: LogLevelName, message: string, metadata?: LogMetadata) => {
    if (!shouldLog(level, resolved.level)) {
      return;
    }

    try {
      const entry = buildEntry(level, message, metadata);
      transport.write(entry);
    } catch {
      // Never throw from logger; silently drop if something unexpected happens.
    }
  };

  return {
    trace: (message, metadata) => log('trace', message, metadata),
    debug: (message, metadata) => log('debug', message, metadata),
    info: (message, metadata) => log('info', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata),
    fatal: (message, metadata) => log('fatal', message, metadata),
  };
}

function buildEntry(level: LogLevelName, message: string, metadata?: LogMetadata) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (metadata !== undefined) {
    return { ...entry, metadata };
  }

  return entry;
}

