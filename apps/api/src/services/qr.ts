/**
 * Project Kharon - QR Code Utility
 * Purpose: Generate QR image URLs consumable by Google Docs inline image insertion.
 * Dependencies: None
 * Structural Role: Logic helper for Level 2 Document Engine
 */

export function generateQrDataUri(text: string): string {
  const encoded = encodeURIComponent(text);
  // Public QR renderer endpoint returning PNG. This yields a real scannable QR
  // while keeping generation deterministic and dependency-free in the worker.
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&data=${encoded}`;
}
