import { LogMetadata } from './types.js';

/**
 * Checks if a value is a plain object (POJO).
 * Non-plain objects (Date, Map, Set, class instances) are treated as leaf values.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  // Check if it's not a special object type
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true; // Object.create(null)
  }

  // Check if prototype chain only has Object.prototype
  return proto === Object.prototype || Object.getPrototypeOf(proto) === null;
}

/**
 * Deep merge context into metadata.
 * 
 * Merge precedence: entry metadata overrides context
 * - Arrays are replaced, not deep-merged
 * - undefined values are ignored (do not delete keys)
 * - Non-plain objects (Date, Map, Set, class instances) are treated as leaf values
 * - Circular references stop traversal but keep the reference
 * 
 * @param context - Logger context to merge
 * @param metadata - Entry metadata (takes precedence)
 * @returns Merged metadata object (new object, never mutates inputs)
 */
export function mergeContext(
  context: LogMetadata | undefined,
  metadata: LogMetadata | undefined,
): LogMetadata | undefined {
  // Fast-path: if both are empty/undefined, return undefined (no allocation)
  if (!context && !metadata) {
    return undefined;
  }

  // If only one exists, return a shallow copy
  if (!context) {
    return metadata ? { ...metadata } : undefined;
  }
  if (!metadata) {
    return { ...context };
  }

  // Both exist, perform deep merge
  const visited = new WeakSet<object>();
  return deepMerge(context, metadata, visited) as LogMetadata;
}

/**
 * Deep merge helper with circular reference protection.
 * Entry metadata overrides context values.
 */
function deepMerge(
  context: unknown,
  metadata: unknown,
  visited: WeakSet<object>,
): unknown {
  // Handle undefined in metadata (ignore, don't delete)
  if (metadata === undefined) {
    return context;
  }

  // Handle non-objects (primitives, null)
  if (metadata === null || typeof metadata !== 'object') {
    return metadata; // Entry metadata overrides
  }

  // Handle arrays: replace, don't merge
  if (Array.isArray(metadata)) {
    return metadata; // Entry metadata overrides
  }

  // Handle non-plain objects (Date, Map, Set, class instances): treat as leaf
  if (!isPlainObject(metadata)) {
    return metadata; // Entry metadata overrides, no traversal
  }

  // Check for circular reference in metadata
  if (visited.has(metadata)) {
    return metadata; // Stop traversal, keep reference
  }

  // Both should be plain objects at this point
  const contextObj = isPlainObject(context) ? context : {};

  // Add to visited set to detect circular references
  visited.add(metadata);

  const result: Record<string, unknown> = {};

  // First, copy all context keys (shallow copy, no deep merge here)
  for (const key in contextObj) {
    if (Object.prototype.hasOwnProperty.call(contextObj, key)) {
      result[key] = contextObj[key];
    }
  }

  // Then, merge metadata keys (overriding context)
  for (const key in metadata) {
    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      const metadataValue = metadata[key];
      const contextValue = result[key];

      // If metadata value is undefined, ignore (don't delete key from context)
      if (metadataValue === undefined) {
        continue;
      }

      // Recursively merge if both are plain objects
      if (isPlainObject(metadataValue) && isPlainObject(contextValue)) {
        // Check for circular reference before recursing
        if (visited.has(metadataValue)) {
          result[key] = metadataValue; // Stop traversal, keep reference
        } else {
          result[key] = deepMerge(contextValue, metadataValue, visited);
        }
      } else {
        // Entry metadata overrides
        result[key] = metadataValue;
      }
    }
  }

  return result;
}

