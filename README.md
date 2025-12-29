# AuroraLog

Structured logging library (JS/TS) with pluggable transports. v0.2 delivers context management, redaction rules, global error capture hooks, and console patching, building on v0.1's console-only logger with level filtering, pretty/JSON modes, and a non-throwing API designed as a drop-in upgrade from `console.log`.

## Installation

```bash
npm install auroralog
```
## What AuroraLog Gives You

- **Structured logging** with levels and pluggable transports
- **Context management** (`withContext`) for request/user scoping
- **Redaction** to prevent leaking secrets
- **Global error capture** for crashes you didn’t explicitly log (Node.js)
- **Console patching** to route `console.*` into structured logs

## Guarantees & Non-Goals

- The logger is **non-throwing** (logging will not crash your app)
- Context is **explicit**, not async-propagated
- User objects are **never mutated**
- Traversal is **bounded** (no infinite recursion)

## Quickstart

```ts
import { createLogger } from 'auroralog';

const logger = createLogger({
  level: 'info', // default is "info"
  console: {
    mode: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
  },
});

logger.info('User logged in', { userId: 123 });
logger.warn('Slow query', { durationMs: 450 });
logger.error('Unhandled error', { err: new Error('boom') });
```

### Level filtering

Messages below the configured `level` are skipped with negligible overhead:

```ts
const logger = createLogger({ level: 'warn' });
logger.info('debugging noise'); // not emitted
logger.error('visible');        // emitted
```

## Exposed API (Quick Reference)

- `createLogger(options?: LoggerOptions): Logger`
- `patchConsole(options: PatchConsoleOptions): () => void`
- `setupGlobalErrorHandling(logger: Logger, options: GlobalErrorHandlingOptions): () => void`
- `getOriginalConsole(): ConsoleLike`

`Logger` methods: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `withContext`.

`LoggerOptions`:
- `level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'` (default: `info`)
- `console?: { mode?: 'pretty' | 'json'; console?: ConsoleLike }`
- `context?: LoggerContext` - Initial context to merge into all log entries
- `redaction?: RedactionOptions` - Redaction configuration for sensitive data
- `globalErrorHandling?: GlobalErrorHandlingOptions` - Global error capture hooks (Node.js only)

Notes:
- Timestamps are ISO strings.
- Metadata can be any serializable object; circular data is safely stringified without throwing.
- The logger is best-effort and never throws; failed writes are swallowed to avoid crashing the app.
- Context merging: entry metadata overrides context values. Arrays are replaced, not merged.
- Redaction: fail-closed policy ensures sensitive data is never exposed, even on errors.

## Formatting modes

- `pretty`: human-friendly, colored/structured text (ideal for dev).
- `json`: machine-friendly JSON lines (ideal for prod/log aggregation).

## Testing

```bash
npm test
```

## Building

```bash
npm run build
```

Outputs to `dist/` with type declarations.

## Context Management

Attach request/user IDs and other metadata that gets merged into all log entries:

```ts
const logger = createLogger({
  context: { userId: 'user-123', requestId: 'req-456' },
});

logger.info('Processing payment'); 
// Logs include: { userId: 'user-123', requestId: 'req-456', ... }

// Create a scoped logger with additional context
const scopedLogger = logger.withContext({ paymentId: 'pay-789' });
scopedLogger.info('Payment processed');
// Logs include: { userId: 'user-123', requestId: 'req-456', paymentId: 'pay-789', ... }
```

**Important**: `withContext()` creates a new logger instance and doesn't mutate the parent logger. Context is merged with entry metadata (entry metadata overrides context values).

## Redaction

Automatically redact sensitive data from logs:

```ts
const logger = createLogger({
  redaction: {
    keys: ['password', 'apiKey', 'token'], // Default keys are included automatically
    redactionValue: '[REDACTED]', // Default: '[REDACTED]'
    caseInsensitive: true, // Default: true
  },
});

logger.info('User login', { 
  username: 'alice', 
  password: 'secret123', // Will be redacted
  apiKey: 'key-abc', // Will be redacted
});
// Password and apiKey are replaced with '[REDACTED]'
```

Redaction applies to context, entry metadata, and error fields. It uses a fail-closed security policy: if redaction fails, raw data is never logged (safe placeholder is used instead).

Default redaction keys: `password`, `passwd`, `pwd`, `secret`, `secrets`, `token`, `tokens`, `accessToken`, `refreshToken`, `apiKey`, `apikey`, `api_key`, `authorization`, `auth`, `authorizationHeader`, `privateKey`, `private_key`, `sessionId`, `session_id`.

## Global Error Handling

Capture uncaught exceptions and unhandled promise rejections:

```ts
const logger = createLogger({
  globalErrorHandling: {
    captureUncaughtException: true,
    captureUnhandledRejection: true,
    exitOnFatal: true, // Default: true for uncaughtException
    exitDelayMs: 100, // Delay before exit to allow log flushing
  },
});

// Uncaught exceptions are logged as 'fatal' level
// Unhandled rejections are logged as 'error' level
```

**Note**: Global error handling is Node.js only and safely no-ops in browser environments. Setup is idempotent (multiple calls don't create duplicate listeners).

All together:
```ts
const logger = createLogger({
  level: 'info',
  context: { service: 'api' },
  redaction: { keys: ['token'] },
  globalErrorHandling: { captureUncaughtException: true },
});

const reqLogger = logger.withContext({ requestId: 'req-1' });

reqLogger.info('Handling request', { token: 'secret' });
```


## Console Patching

Route console method calls (console.log, console.error, etc.) through the structured logger:

```ts
import { createLogger, patchConsole, getOriginalConsole } from 'auroralog';

const logger = createLogger({
  // Important: use original console to prevent recursion
  console: { console: getOriginalConsole() },
});

// Patch console methods (routes to logger by default)
const cleanup = patchConsole({ logger });

console.log('Hello'); // Routes to logger.info() (log level)
console.error('Error'); // Routes to logger.error() (log level)

// Restore original console
cleanup();
```

You can customize which console methods to patch and map them to log levels:

```ts
patchConsole({
  logger,
  methods: ['log', 'error'], // Only patch these console methods
  map: {
    log: 'debug', // Map console.log → logger.debug (log level)
    error: 'warn', // Map console.error → logger.warn (log level)
  },
});
```

**Note**: Console methods (`log`, `info`, `warn`, `error`, `debug`, `trace`) are distinct from log levels (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). The `map` option lets you route console method calls to any log level.

## Roadmap (excerpt)

- ✅ v0.2: context + redaction, console patch helper, global error hooks.
- v0.3: file + memory transports, presets.
- v0.4: HTTP transport with batching/retry/drop policy.

See `plan.md` for full staged releases.

