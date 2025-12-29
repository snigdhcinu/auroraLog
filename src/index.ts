export { createLogger } from './logger.js';
export { patchConsole, getOriginalConsole } from './consolePatch.js';
export { setupGlobalErrorHandling } from './globalErrorHandling.js';
export { DEFAULT_REDACTION_KEYS } from './redaction.js';
export type {
  Logger,
  LoggerOptions,
  LogLevelName,
  LogMetadata,
  LogEntry,
  ConsoleMode,
  ConsoleTransportOptions,
  LoggerContext,
  RedactionOptions,
  GlobalErrorHandlingOptions,
  ConsoleMethod,
  PatchConsoleOptions,
} from './types.js';

