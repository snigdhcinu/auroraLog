import { ConsoleTransport } from './consoleTransport.js';
import { setupGlobalErrorHandling } from './globalErrorHandling.js';
import { DEFAULT_LEVEL, shouldLog } from './levels.js';
import { mergeContext } from './mergeContext.js';
import { redactMetadata } from './redaction.js';
export function createLogger(options) {
    const resolved = {
        level: options?.level ?? DEFAULT_LEVEL,
        console: options?.console ?? {},
        context: options?.context,
        redaction: options?.redaction,
    };
    const transport = new ConsoleTransport(resolved.console);
    const log = (level, message, metadata) => {
        // Early-return fast-path: skip all processing if level is disabled
        if (!shouldLog(level, resolved.level)) {
            return;
        }
        try {
            const entry = buildEntry(level, message, metadata, resolved.context, resolved.redaction);
            transport.write(entry);
        }
        catch {
            // Never throw from logger; silently drop if something unexpected happens.
        }
    };
    const logger = {
        trace: (message, metadata) => log('trace', message, metadata),
        debug: (message, metadata) => log('debug', message, metadata),
        info: (message, metadata) => log('info', message, metadata),
        warn: (message, metadata) => log('warn', message, metadata),
        error: (message, metadata) => log('error', message, metadata),
        fatal: (message, metadata) => log('fatal', message, metadata),
        withContext: (context) => {
            // Merge new context with existing context
            // Note: This creates a new logger with merged context, parent logger context remains unchanged
            const mergedContext = mergeContext(resolved.context, context);
            return createLogger({
                ...options,
                context: mergedContext,
            });
        },
    };
    // Setup global error handling if options are provided
    if (options?.globalErrorHandling) {
        setupGlobalErrorHandling(logger, options.globalErrorHandling);
    }
    return logger;
}
function buildEntry(level, message, metadata, context, redactionOptions) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };
    // Merge context into metadata (entry metadata overrides context)
    const mergedMetadata = mergeContext(context, metadata);
    if (mergedMetadata !== undefined) {
        // Apply redaction if configured (fail-closed: wraps in try-catch)
        let finalMetadata;
        try {
            finalMetadata = redactMetadata(mergedMetadata, redactionOptions ?? {});
        }
        catch {
            // Fail-closed security policy: redaction already returns safe placeholder on error
            // This catch is redundant but explicit for safety
            finalMetadata = { redactionError: true, redacted: true };
        }
        return { ...entry, metadata: finalMetadata };
    }
    return entry;
}
//# sourceMappingURL=logger.js.map