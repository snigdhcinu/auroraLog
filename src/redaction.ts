import { LogMetadata } from './types.js';

/**
 * Default redaction keys (case-insensitive matching applied).
 * Common sensitive keys that should be redacted by default.
 */
export const DEFAULT_REDACTION_KEYS: readonly string[] = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'secrets',
  'token',
  'tokens',
  'accessToken',
  'refreshToken',
  'apiKey',
  'apikey',
  'api_key',
  'authorization',
  'auth',
  'authorizationHeader',
  'privateKey',
  'private_key',
  'sessionId',
  'session_id',
] as const;

const DEFAULT_REDACTION_VALUE = '[REDACTED]';
const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_KEYS = 2000;
const DEFAULT_CASE_INSENSITIVE = true;

/**
 * Checks if a value is a plain object (POJO).
 * Non-plain objects (Date, Map, Set, class instances) are treated as leaf values.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true; // Object.create(null)
  }

  return proto === Object.prototype || Object.getPrototypeOf(proto) === null;
}

/**
 * Normalizes a key for case-insensitive comparison.
 */
function normalizeKey(key: string, caseInsensitive: boolean): string {
  return caseInsensitive ? key.toLowerCase() : key;
}

/**
 * Checks if a key should be redacted.
 */
function shouldRedactKey(
  key: string,
  redactionKeys: Set<string>,
  caseInsensitive: boolean,
): boolean {
  if (caseInsensitive) {
    return redactionKeys.has(key.toLowerCase());
  }
  return redactionKeys.has(key);
}

/**
 * Redacts sensitive data from metadata.
 * 
 * Features:
 * - Plain object detection (non-plain objects treated as leaf values)
 * - Case-insensitive key matching (configurable)
 * - Circular reference safety (WeakSet, stops traversal)
 * - Traversal limits (maxDepth, maxKeys)
 * - Immutability (never mutates input objects)
 * - Fail-closed: on error, returns safe placeholder
 * 
 * @param metadata - Metadata to redact
 * @param options - Redaction options
 * @returns Redacted metadata (new object, never mutates input)
 */
export function redactMetadata(
  metadata: LogMetadata | undefined,
  options: {
    keys?: string[];
    redactionValue?: string;
    caseInsensitive?: boolean;
    maxDepth?: number;
    maxKeys?: number;
  },
): LogMetadata | undefined {
  try {
    if (metadata === undefined) {
      return undefined;
    }

    const redactionKeys = new Set<string>(
      (options.keys ?? DEFAULT_REDACTION_KEYS).map((key) =>
        options.caseInsensitive ?? DEFAULT_CASE_INSENSITIVE
          ? key.toLowerCase()
          : key,
      ),
    );
    const redactionValue = options.redactionValue ?? DEFAULT_REDACTION_VALUE;
    const caseInsensitive = options.caseInsensitive ?? DEFAULT_CASE_INSENSITIVE;
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
    const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;

    const visited = new WeakSet<object>();
    const keyCounter = { count: 0 };

    return redactValue(metadata, redactionKeys, redactionValue, caseInsensitive, maxDepth, maxKeys, visited, 0, keyCounter) as LogMetadata;
  } catch {
    // Fail-closed security policy: never expose raw data on error
    return { redactionError: true, redacted: true };
  }
}

/**
 * Recursive redaction helper with traversal limits and circular reference protection.
 */
function redactValue(
  value: unknown,
  redactionKeys: Set<string>,
  redactionValue: string,
  caseInsensitive: boolean,
  maxDepth: number,
  maxKeys: number,
  visited: WeakSet<object>,
  currentDepth: number,
  keyCounter: { count: number },
): unknown {
  // Traversal limits
  if (currentDepth >= maxDepth) {
    return value; // Stop traversal at max depth
  }

  // Handle non-objects (primitives, null)
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (keyCounter.count >= maxKeys) {
        return item; // Stop processing if key limit reached
      }
      return redactValue(item, redactionKeys, redactionValue, caseInsensitive, maxDepth, maxKeys, visited, currentDepth + 1, keyCounter);
    });
  }

  // Handle non-plain objects (Date, Map, Set, class instances): treat as leaf
  if (!isPlainObject(value)) {
    return value; // No traversal, return as-is
  }

  // Check for circular reference
  if (visited.has(value)) {
    return value; // Stop traversal, keep reference
  }

  // Add to visited set
  visited.add(value);

  // Create new object (immutability guarantee)
  const result: Record<string, unknown> = {};

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      // Check key limit before processing
      if (keyCounter.count >= maxKeys) {
        // Stop processing remaining keys, copy as-is
        for (const remainingKey in value) {
          if (Object.prototype.hasOwnProperty.call(value, remainingKey) && !(remainingKey in result)) {
            result[remainingKey] = value[remainingKey];
          }
        }
        break;
      }

      keyCounter.count++;

      const originalValue = value[key];

      // Check if key should be redacted
      if (shouldRedactKey(key, redactionKeys, caseInsensitive)) {
        result[key] = redactionValue;
        continue;
      }

      // Recursively redact nested values
      if (originalValue !== null && typeof originalValue === 'object') {
        // Check for circular reference before recursing
        if (visited.has(originalValue as object)) {
          result[key] = originalValue; // Keep reference
        } else {
          result[key] = redactValue(
            originalValue,
            redactionKeys,
            redactionValue,
            caseInsensitive,
            maxDepth,
            maxKeys,
            visited,
            currentDepth + 1,
            keyCounter,
          );
        }
      } else {
        result[key] = originalValue;
      }
    }
  }

  return result;
}

