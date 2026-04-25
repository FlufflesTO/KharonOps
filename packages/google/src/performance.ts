/**
 * Performance optimization utilities for Google Sheets operations
 * Implements batching, caching, and rate limiting to improve performance
 */

import type { GoogleRuntimeConfig } from "./types.js";
import { googleApiRequest } from "./client.js";

// Cache for sheet metadata and layouts to reduce API calls
const sheetCache = new Map<string, { data: any; timestamp: number }>();

// Rate limiter to prevent exceeding Google API quotas
class RateLimiter {
  private queue: Array<() => void> = [];
  private lastCallTime = 0;
  private minInterval = 100; // Minimum interval between API calls in ms

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now();
        if (now - this.lastCallTime >= this.minInterval) {
          this.lastCallTime = now;
          resolve();
        } else {
          this.queue.push(tryAcquire);
        }
      };

      tryAcquire();
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        setTimeout(next, 0);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

/**
 * Gets sheet values with caching to reduce API calls
 */
export async function getCachedSheetValues(
  config: GoogleRuntimeConfig,
  sheetName: string,
  cacheTimeoutMs: number = 5000 // 5 seconds default
): Promise<any[][]> {
  const cacheKey = `${config.workbookSpreadsheetId}:${sheetName}`;
  const cached = sheetCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < cacheTimeoutMs) {
    return cached.data;
  }

  await rateLimiter.acquire();
  try {
    const response = await googleApiRequest<{ values?: any[][] }>({
      config,
      service: "sheets",
      url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A:ZZ`,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const values = response.values ?? [];
    sheetCache.set(cacheKey, { data: values, timestamp: Date.now() });
    
    return values;
  } finally {
    rateLimiter.release();
  }
}

/**
 * Clears the cache for a specific sheet or all sheets
 */
export function clearSheetCache(sheetName?: string) {
  if (sheetName) {
    const keysToRemove = Array.from(sheetCache.keys()).filter(key => 
      key.endsWith(`:${sheetName}`)
    );
    keysToRemove.forEach(key => sheetCache.delete(key));
  } else {
    sheetCache.clear();
  }
}

/**
 * Batches multiple row updates into a single API call
 */
export async function batchUpdateRows(
  config: GoogleRuntimeConfig,
  sheetName: string,
  updates: Array<{ rowIndex: number; rowData: string[] }>
): Promise<void> {
  if (updates.length === 0) return;

  // Sort updates by row index to ensure proper ordering
  updates.sort((a, b) => a.rowIndex - b.rowIndex);

  // Prepare the batch update request
  const valueRanges = updates.map(update => ({
    range: `'${encodeURIComponent(sheetName)}'!${update.rowIndex}:${update.rowIndex}`,
    values: [update.rowData]
  }));

  await rateLimiter.acquire();
  try {
    await googleApiRequest({
      config,
      service: "sheets",
      url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}/values:batchUpdate`,
      method: "POST",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: valueRanges
      })
    });
  } finally {
    rateLimiter.release();
  }
}

/**
 * Batches multiple row appends into a single API call
 */
export async function batchAppendRows(
  config: GoogleRuntimeConfig,
  sheetName: string,
  rows: string[][]
): Promise<void> {
  if (rows.length === 0) return;

  await rateLimiter.acquire();
  try {
    await googleApiRequest({
      config,
      service: "sheets",
      url: `https://sheets.googleapis.com/v4/spreadsheets/${config.workbookSpreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A:ZZ:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      method: "POST",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        values: rows
      })
    });
  } finally {
    rateLimiter.release();
  }
}

/**
 * Optimized function to find a row by key field with caching
 */
export async function findRowWithCaching(
  config: GoogleRuntimeConfig,
  sheetName: string,
  keyField: string,
  targetValue: string,
  cacheTimeoutMs: number = 5000
): Promise<{ row: any[] | null; rowIndex: number } | null> {
  const values = await getCachedSheetValues(config, sheetName, cacheTimeoutMs);
  
  if (values.length === 0) {
    return null;
  }

  // Find the header row and the index of the key field
  const headerRow = values[0];
  const keyFieldIndex = headerRow.findIndex((cell: string) => cell?.trim() === keyField);

  if (keyFieldIndex === -1) {
    throw new Error(`Key field "${keyField}" not found in sheet "${sheetName}"`);
  }

  // Search for the target value in the specified column
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row && row[keyFieldIndex] === targetValue) {
      return { row, rowIndex: i + 1 }; // Google Sheets uses 1-based indexing
    }
  }

  return { row: null, rowIndex: -1 };
}