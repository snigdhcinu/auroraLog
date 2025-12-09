import { levelToConsoleMethod } from './levels.js';
import { formatEntry } from './formatters.js';
import { ConsoleLike, ConsoleMode, ConsoleTransportOptions, LogEntry } from './types.js';

const DEFAULT_MODE: ConsoleMode = process.env.NODE_ENV === 'production' ? 'json' : 'pretty';

export class ConsoleTransport {
  private mode: ConsoleMode;
  private console: ConsoleLike;

  constructor(options?: ConsoleTransportOptions) {
    this.mode = options?.mode ?? DEFAULT_MODE;
    this.console = options?.console ?? globalThis.console;
  }

  write(entry: LogEntry): void {
    const method = levelToConsoleMethod[entry.level];
    const writer = this.console[method] ?? this.console.log;
    const formatted = formatEntry(entry, this.mode);
    // Swallow any unexpected errors during write to avoid crashing the app.
    try {
      writer(formatted);
    } catch {
      // Intentionally ignore to keep logger non-throwing.
    }
  }
}

