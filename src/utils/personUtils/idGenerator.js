// src/utils/idGenerator.js
let counter = 0;

/**
 * Generate a unique ID with a given prefix.
 * Prefer browser's crypto.randomUUID when available to avoid collisions across reloads.
 * Falls back to a simple counter if not available.
 * Example: generateId("person") → "person_9f1b2c..."
 */
export function generateId(prefix = "id") {
  let uniquePart;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    uniquePart = crypto.randomUUID();
  } else {
    counter += 1;
    uniquePart = `${Date.now()}_${counter}`;
  }

  const id = `${prefix}_${uniquePart}`;
  console.log(`DBG:idGenerator -> generated id "${id}" (prefix="${prefix}")`);
  return id;
}
