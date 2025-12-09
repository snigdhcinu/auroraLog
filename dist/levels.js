export const LOG_LEVELS = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};
export const DEFAULT_LEVEL = 'info';
export const levelToConsoleMethod = {
    trace: 'debug',
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error',
    fatal: 'error',
};
export function shouldLog(level, minLevel) {
    return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}
//# sourceMappingURL=levels.js.map