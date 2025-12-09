export type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export interface LogMetadata {
    [key: string]: unknown;
}
export interface LogEntry {
    timestamp: string;
    level: LogLevelName;
    message: string;
    metadata?: LogMetadata;
}
export type ConsoleMode = 'pretty' | 'json';
export interface ConsoleLike {
    log: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug?: (...args: unknown[]) => void;
    trace?: (...args: unknown[]) => void;
}
export interface ConsoleTransportOptions {
    mode?: ConsoleMode;
    console?: ConsoleLike;
}
export interface LoggerOptions {
    level?: LogLevelName;
    console?: ConsoleTransportOptions;
}
export interface Logger {
    trace: (message: string, metadata?: LogMetadata) => void;
    debug: (message: string, metadata?: LogMetadata) => void;
    info: (message: string, metadata?: LogMetadata) => void;
    warn: (message: string, metadata?: LogMetadata) => void;
    error: (message: string, metadata?: LogMetadata) => void;
    fatal: (message: string, metadata?: LogMetadata) => void;
}
