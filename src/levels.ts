import { ConsoleLike, LogLevelName } from './types.js';

export const LOG_LEVELS: Record<LogLevelName, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export const DEFAULT_LEVEL: LogLevelName = 'info';

export const levelToConsoleMethod: Record<LogLevelName, keyof ConsoleLike> = {
  trace: 'debug',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

export function shouldLog(level: LogLevelName, minLevel: LogLevelName): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

