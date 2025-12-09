import { ConsoleLike, LogLevelName } from './types.js';
export declare const LOG_LEVELS: Record<LogLevelName, number>;
export declare const DEFAULT_LEVEL: LogLevelName;
export declare const levelToConsoleMethod: Record<LogLevelName, keyof ConsoleLike>;
export declare function shouldLog(level: LogLevelName, minLevel: LogLevelName): boolean;
