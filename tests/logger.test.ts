import { describe, it, expect, vi } from 'vitest';
import { createLogger } from '../src/index.js';
import { ConsoleMode } from '../src/types.js';

function createConsoleMock() {
  const log = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const debug = vi.fn();
  return { log, info, warn, error, debug };
}

describe('createLogger', () => {
  it('filters messages below level fast-path', () => {
    const mockConsole = createConsoleMock();
    const logger = createLogger({
      level: 'warn',
      console: { console: mockConsole },
    });

    logger.info('should be skipped');
    logger.warn('should be logged');

    expect(mockConsole.info).not.toHaveBeenCalled();
    expect(mockConsole.warn).toHaveBeenCalledTimes(1);
  });

  it('emits structured JSON by default in production mode', () => {
    const mockConsole = createConsoleMock();
    const logger = createLogger({
      console: { console: mockConsole, mode: 'json' },
    });

    logger.info('hello', { userId: 123 });

    expect(mockConsole.info).toHaveBeenCalledTimes(1);
    const payload = mockConsole.info.mock.calls[0][0] as string;
    const parsed = JSON.parse(payload);
    expect(parsed.message).toBe('hello');
    expect(parsed.level).toBe('info');
    expect(parsed.metadata).toEqual({ userId: 123 });
    expect(parsed.timestamp).toBeTruthy();
  });

  it('pretty prints in pretty mode', () => {
    const mockConsole = createConsoleMock();
    const logger = createLogger({
      console: { console: mockConsole, mode: 'pretty' satisfies ConsoleMode },
    });

    logger.error('oops', { reason: 'boom' });

    expect(mockConsole.error).toHaveBeenCalledTimes(1);
    const line = mockConsole.error.mock.calls[0][0] as string;
    expect(line).toContain('[ERROR]');
    expect(line).toContain('oops');
    expect(line).toContain('reason');
  });

  it('never throws even when metadata is not serializable', () => {
    const mockConsole = createConsoleMock();
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const logger = createLogger({
      console: { console: mockConsole, mode: 'json' },
    });

    expect(() => logger.info('circular', circular)).not.toThrow();
    expect(mockConsole.info).toHaveBeenCalledTimes(1);
  });
});

