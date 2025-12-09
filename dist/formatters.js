export function formatEntry(entry, mode) {
    return mode === 'pretty' ? formatPretty(entry) : formatJson(entry);
}
function formatPretty(entry) {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.metadata === undefined) {
        return base;
    }
    return `${base} ${safeStringify(entry.metadata)}`;
}
function formatJson(entry) {
    return safeStringify(entry);
}
function safeStringify(value) {
    try {
        return JSON.stringify(value);
    }
    catch {
        // Fall back to string coercion to avoid throwing inside the logger.
        return String(value);
    }
}
//# sourceMappingURL=formatters.js.map