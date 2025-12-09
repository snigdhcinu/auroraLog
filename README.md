# AuroraLog

Structured logging library (JS/TS) with pluggable transports. v0.1 delivers a console-only logger with level filtering, pretty/JSON modes, and a non-throwing API designed as a drop-in upgrade from `console.log`.

## Installation

```bash
npm install auroralog
```

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

## API

- `createLogger(options?: LoggerOptions): Logger`

`Logger` methods: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

`LoggerOptions` (v0.1):
- `level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'` (default: `info`)
- `console?: { mode?: 'pretty' | 'json'; console?: ConsoleLike }`

Notes:
- Timestamps are ISO strings.
- Metadata can be any serializable object; circular data is safely stringified without throwing.
- The logger is best-effort and never throws; failed writes are swallowed to avoid crashing the app.

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

## Roadmap (excerpt)

- v0.2: context + redaction, console patch helper.
- v0.3: file + memory transports, presets.
- v0.4: HTTP transport with batching/retry/drop policy.

See `plan.md` for full staged releases.

