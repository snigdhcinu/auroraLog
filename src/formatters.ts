import { LogEntry, ConsoleMode } from './types.js';

export function formatEntry(entry: LogEntry, mode: ConsoleMode): string {
  return mode === 'pretty' ? formatPretty(entry) : formatJson(entry);
}

function formatPretty(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  if (entry.metadata === undefined) {
    return base;
  }
  return `${base} ${safeStringify(entry.metadata)}`;
}

function formatJson(entry: LogEntry): string {
  return safeStringify(entry);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    // Fall back to string coercion to avoid throwing inside the logger.
    return String(value);
  }
}

