/**
 * Result Type Definition
 * 
 * Type-safe error handling pattern for async operations.
 * Avoids throwing exceptions and makes error handling explicit.
 * 
 * @module types/result
 */

/**
 * Result type for operations that can succeed or fail
 * 
 * @template T - The type of the success value
 * 
 * @example
 * ```typescript
 * async function loadFile(path: string): Promise<Result<string>> {
 *   try {
 *     const content = await fs.readFile(path, 'utf-8');
 *     return { success: true, data: content };
 *   } catch (error) {
 *     return { success: false, error: 'Failed to load file' };
 *   }
 * }
 * 
 * const result = await loadFile('config.json');
 * if (result.success) {
 *   console.log('File content:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create a success result
 * 
 * @template T - The type of the success value
 * @param data - The success data
 * @returns Success result
 * 
 * @example
 * ```typescript
 * const result = success({ id: 1, name: 'Video' });
 * ```
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 * 
 * @template T - The type that would have been returned on success
 * @param error - The error message
 * @returns Failure result
 * 
 * @example
 * ```typescript
 * const result = failure<string>('File not found');
 * ```
 */
export function failure<T>(error: string): Result<T> {
  return { success: false, error };
}

/**
 * Format an unknown error into a string message
 * 
 * Safely extracts error messages from various error types.
 * 
 * @param error - The error to format
 * @returns Error message string
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const message = formatError(error);
 *   return failure(message);
 * }
 * ```
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

