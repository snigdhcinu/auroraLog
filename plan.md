AuroraLog Release Plan

v0.1 — Core Structured Logger (MVP)
- Basic API: createLogger, logger.info|warn|error with structured JSON payload (timestamp, level, message, metadata).
- Standard levels: TRACE/DEBUG/INFO/WARN/ERROR/FATAL.
- Console transport only: dev pretty-print, prod JSON.
- Config via init object; minimal defaults (level, console format).
- TS-first typing; unit tests around core logger and console transport.
- Goal: immediate replacement for console.log with structured output.
- Acceptance signals: JSON shape contract documented; level filtering fast-path benchmark (disabled level adds negligible overhead); logger must never throw.

v0.2 — Context & Redaction
- logger.withContext to attach request/user IDs and merge into entries.
- Redaction rules (configurable keys like secrets, tokens) applied before dispatch.
- Global error capture hooks: uncaughtException, unhandledRejection → route through logger.
- DX: lightweight helper to patch console (console.patch() optional).
- Tests for context merging, redaction correctness, and global error handling.
- Acceptance signals: default redaction keys list; context merge precedence defined (entry metadata overrides context or vice versa); logger remains non-throwing under malformed metadata.

v0.3 — File + Memory Transports
- File transport: append-only with size/time rotation; optional compression stub.
- Memory transport for tests: capture + retrieve/clear API.
- Config presets: dev, test, prod (level defaults + console/file choices).
- Basic operational guards: backpressure-friendly drop policy stub for file/memory.
- Tests: rotation behavior, memory assertions, preset coverage.
- Clarify rotation: priority of size vs time, max files kept, behavior on disk-full.
- Add env-var config for presets to reduce friction before HTTP/file usage.

v0.4 — HTTP Transport (Batching & Reliability)
- HTTP transport with immediate or batched sends; retry with backoff; drop policy under pressure.
- TLS and endpoint config; headers/meta injection.
- Observable transport metrics (queue depth, failed sends) surfaced via events/callbacks.
- Tests: retry/backoff, batching, drop behavior, graceful degradation on network failure.
- Specify batching and drop policy limits: max queue depth, batch size, retry cap, latency/error budget under backoff.

v0.5 — Formatting & Customization
- Pluggable formatter interface; built-ins: JSON formatter, pretty formatter, message templating.
- Custom transports + custom formatters API hardened; documented extension points.
- Performance guardrails: avoid work when level disabled; microbench harness for formatter/transports.
- Tests: formatter correctness, extension contracts, perf budgets.
- Choose minimal templating syntax and document how redaction runs relative to templating.

v0.6 — Browser Support & Tree-Shakeable Build
- Browser bundle with tree-shaking-friendly exports; adapt transports (console, HTTP only).
- Async context propagation strategy for browser; safe defaults (no file).
- Build outputs: ESM/CJS + browser; clear environment detection.
- Tests: browser-focused (via jsdom/playwright), bundle size guardrails.
- Define browser context approach (e.g., async local storage polyfill vs noop) and bundle size budget to keep “tree-shakeable” meaningful.

v0.7 — Operations & Live Config
- Dynamic log-level reload without redeploy (hot config update API).
- Monitoring hooks for buffer/queue state; optional callbacks or emitter.
- Config from env vars with override precedence defined.
- Docs for operational runbooks (level changes, buffer monitoring).
- Specify precedence for live config (env > file > code or similar) and API for hot level updates (event vs polling).

v0.8 — Adapters & Integrations
- Framework adapters (e.g., Express/Koa middleware for request context) as optional packages.
- Telemetry integration hooks (foundation for future OpenTelemetry).
- Expanded redaction defaults and templated rules per environment.
- Docs and examples for common stacks.
- Limit adapter scope initially (e.g., Express/Koa first) to keep version manageable.

v0.9 — Hardening & Docs
- Reliability sweeps: soak tests, fuzzing on formatter/meta serialization.
- Security review (redaction coverage, TLS defaults).
- Documentation site: quickstart, presets, recipes, extension guides.
- Versioned SemVer policy and migration notes.
- Add migration guide template, minimum soak duration/coverage target, and fuzzing scope (formatters, redaction, transport payloads).

v1.0 — GA
- Stabilize APIs; finalize default presets and redaction set.
- Performance budget sign-off and benchmarks published.
- Backward-compat guarantees; deprecation policy; long-term support statement.
- Marketing/OSS release materials (README, badges, examples).
- Confirm observability hooks footprint (events/callbacks) and publish benchmark/reporting artifacts.

