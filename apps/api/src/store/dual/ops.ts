export interface ConsistencyReport {
  consistent: boolean;
  discrepancies: ConsistencyDiscrepancy[];
}

export interface ConsistencyDiscrepancy {
  entity: string;
  entityId: string;
  primaryValue: Record<string, unknown> | null;
  mirrorValue: Record<string, unknown> | null;
  field: string;
  primaryFieldValue: unknown;
  mirrorFieldValue: unknown;
}

export function compareRecords(
  entity: string,
  entityId: string,
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null
): ConsistencyDiscrepancy[] {
  const discrepancies: ConsistencyDiscrepancy[] = [];

  if (a === null && b === null) return discrepancies;

  if (a === null) {
    for (const [key, value] of Object.entries(b as Record<string, unknown>)) {
      discrepancies.push({
        entity,
        entityId,
        primaryValue: null,
        mirrorValue: b,
        field: key,
        primaryFieldValue: undefined,
        mirrorFieldValue: value
      });
    }
    return discrepancies;
  }

  if (b === null) {
    for (const [key, value] of Object.entries(a)) {
      discrepancies.push({
        entity,
        entityId,
        primaryValue: a,
        mirrorValue: null,
        field: key,
        primaryFieldValue: value,
        mirrorFieldValue: undefined
      });
    }
    return discrepancies;
  }

  const allKeys = new Set([...Object.keys(a), ...Object.keys(b as Record<string, unknown>)]);
  for (const key of allKeys) {
    const aVal = a[key];
    const bVal = (b as Record<string, unknown>)[key];
    if (!deepEqual(aVal, bVal)) {
      discrepancies.push({
        entity,
        entityId,
        primaryValue: a,
        mirrorValue: b,
        field: key,
        primaryFieldValue: aVal,
        mirrorFieldValue: bVal
      });
    }
  }

  return discrepancies;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>).sort();
    const bKeys = Object.keys(b as Record<string, unknown>).sort();
    if (aKeys.length !== bKeys.length) return false;
    if (!aKeys.every((k, i) => k === bKeys[i])) return false;
    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

export type ConflictResolutionStrategy = "primary_wins" | "mirror_wins" | "latest_timestamp" | "manual";

export function resolveConflict(
  strategy: ConflictResolutionStrategy,
  primaryValue: unknown,
  mirrorValue: unknown
): unknown {
  switch (strategy) {
    case "primary_wins":
      return primaryValue;
    case "mirror_wins":
      return mirrorValue;
    case "latest_timestamp": {
      const primaryObj = primaryValue as Record<string, unknown> | null;
      const mirrorObj = mirrorValue as Record<string, unknown> | null;
      if (primaryObj === null) return mirrorValue;
      if (mirrorObj === null) return primaryValue;
      const primaryTs = String(primaryObj.updated_at ?? "");
      const mirrorTs = String(mirrorObj.updated_at ?? "");
      return primaryTs >= mirrorTs ? primaryValue : mirrorValue;
    }
    case "manual":
      return primaryValue;
  }
}

export function log(level: "info" | "warn" | "error", label: string, message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, store: label, message, ...(data ?? {}) };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number,
  label: string,
  operation: string
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        log("warn", label, `Retry ${attempt + 1}/${maxRetries} for ${operation}`, { error: lastError.message });
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error(`Unknown error during ${operation}`);
}
