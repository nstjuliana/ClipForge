/**
 * IPC Type Definitions
 * 
 * TypeScript interfaces and types for IPC communication between main and renderer.
 * Ensures type safety for all IPC messages.
 */

/**
 * Base response type for IPC operations.
 */
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Handlers namespace for typing IPC message channels.
 */
export namespace IPCHandlers {
  // Placeholder for future handler types
}

