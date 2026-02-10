/**
 * QR Code Helpers
 * Utility functions for RFID code validation and QR URL generation
 */

/**
 * Validates RFID code format
 * @param code - The RFID code to validate
 * @returns true if code is valid (alphanumeric, 4-100 characters)
 */
export function isValidRFIDCode(code: string | null | undefined): boolean {
  if (!code || code.trim().length === 0) return false;
  const pattern = /^[A-Za-z0-9]{4,100}$/;
  return pattern.test(code.trim());
}

/**
 * Sanitizes RFID code (trim and uppercase)
 * @param code - The RFID code to sanitize
 * @returns Sanitized code
 */
export function sanitizeRFIDCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Generates QR code URL for a given RFID code
 * @param code - The RFID code
 * @param baseUrl - Optional base URL (defaults to NEXT_PUBLIC_BASE_URL)
 * @returns Full QR URL
 */
export function generateQRUrl(code: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${base}/qr/${sanitizeRFIDCode(code)}`;
}

/**
 * Validates person name
 * @param name - The name to validate
 * @returns true if name is valid (min 2 characters)
 */
export function isValidPersonName(name: string | null | undefined): boolean {
  if (!name || name.trim().length < 2) return false;
  return name.trim().length <= 255;
}

/**
 * Validates optional field length
 * @param value - The value to validate
 * @param maxLength - Maximum allowed length
 * @returns true if value is valid or empty
 */
export function isValidOptionalField(
  value: string | null | undefined,
  maxLength: number = 255
): boolean {
  if (!value) return true;
  return value.trim().length <= maxLength;
}
