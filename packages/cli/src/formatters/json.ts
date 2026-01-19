/**
 * JSON formatter
 */

/**
 * Format data as JSON string
 */
export function formatJson(data: unknown, pretty: boolean = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}
