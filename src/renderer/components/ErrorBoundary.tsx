/**
 * Error Boundary Component
 * 
 * React error boundary to catch and display rendering errors.
 * Prevents the entire app from crashing when a component error occurs.
 * 
 * @component
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for ErrorBoundary component
 * 
 * @interface ErrorBoundaryProps
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  
  /** Optional fallback UI to show on error */
  fallback?: ReactNode;
  
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for ErrorBoundary component
 * 
 * @interface ErrorBoundaryState
 */
interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  
  /** The caught error */
  error: Error | null;
  
  /** Additional error information */
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary onError={(error) => console.error(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error boundary
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-8">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">⚠️</div>
              <div>
                <h1 className="text-3xl font-bold text-red-500">Something went wrong</h1>
                <p className="text-gray-400 mt-1">An unexpected error occurred</p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700">
                <p className="font-mono text-sm text-red-400 mb-2">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.resetError}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Reload App
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded">
              <p className="text-sm text-blue-300">
                <strong>Tips:</strong>
              </p>
              <ul className="mt-2 text-sm text-gray-400 space-y-1 list-disc list-inside">
                <li>Try reloading the app</li>
                <li>Check if your video files are accessible</li>
                <li>Close and reopen the application</li>
                <li>If the problem persists, report it to support</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version of ErrorBoundary for functional components
 * 
 * Note: Error boundaries must be class components.
 * This is a wrapper to use in functional components.
 * 
 * @param props - ErrorBoundary props
 * @returns ErrorBoundary component
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ErrorBoundary>
 *       <MyComponents />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

