/**
 * Undo/Redo Context
 * 
 * Provides undo/redo functionality to components.
 * Manages keyboard shortcuts (Ctrl+Z, Ctrl+Y) for undo/redo operations.
 * 
 * @module contexts/UndoRedoContext
 */

import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { UndoRedoManager, createUndoRedoManager, type TimelineStateSnapshot } from '@/services/undoRedoService';

/**
 * Undo/Redo context value type
 * 
 * @interface UndoRedoContextValue
 */
interface UndoRedoContextValue {
  /** Whether undo is possible */
  canUndo: boolean;
  
  /** Whether redo is possible */
  canRedo: boolean;
  
  /** Perform undo */
  undo: () => TimelineStateSnapshot | null;
  
  /** Perform redo */
  redo: () => TimelineStateSnapshot | null;
  
  /** Record a state change */
  recordChange: (
    before: TimelineStateSnapshot,
    after: TimelineStateSnapshot,
    description?: string
  ) => void;
  
  /** Clear all history */
  clear: () => void;
  
  /** Initialize with current state */
  initialize: (state: TimelineStateSnapshot) => void;
  
  /** Get the manager instance (for advanced use) */
  getManager: () => UndoRedoManager;
}

/**
 * Undo/Redo Context
 */
export const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

/**
 * Undo/Redo Provider Props
 * 
 * @interface UndoRedoProviderProps
 */
export interface UndoRedoProviderProps {
  children: React.ReactNode;
  /** Maximum history size */
  maxHistorySize?: number;
  /** Callback when undo/redo is performed */
  onStateChange?: (newState: TimelineStateSnapshot) => void;
}

/**
 * Undo/Redo Provider Component
 * 
 * Provides undo/redo functionality to all child components.
 * Manages keyboard shortcuts and history state.
 * 
 * @component
 */
export function UndoRedoProvider({ 
  children, 
  maxHistorySize = 50,
  onStateChange,
}: UndoRedoProviderProps) {
  const managerRef = useRef<UndoRedoManager>(createUndoRedoManager(maxHistorySize));
  
  /**
   * Perform undo
   */
  const undo = useCallback((): TimelineStateSnapshot | null => {
    const newState = managerRef.current.undo();
    if (newState && onStateChange) {
      onStateChange(newState);
    }
    return newState;
  }, [onStateChange]);
  
  /**
   * Perform redo
   */
  const redo = useCallback((): TimelineStateSnapshot | null => {
    const newState = managerRef.current.redo();
    if (newState && onStateChange) {
      onStateChange(newState);
    }
    return newState;
  }, [onStateChange]);
  
  /**
   * Record a state change
   */
  const recordChange = useCallback((
    before: TimelineStateSnapshot,
    after: TimelineStateSnapshot,
    description?: string
  ): void => {
    managerRef.current.recordChange(before, after, description);
  }, []);
  
  /**
   * Clear all history
   */
  const clear = useCallback((): void => {
    managerRef.current.clear();
  }, []);
  
  /**
   * Initialize with current state
   */
  const initialize = useCallback((state: TimelineStateSnapshot): void => {
    managerRef.current.initialize(state);
  }, []);
  
  /**
   * Get manager instance
   */
  const getManager = useCallback((): UndoRedoManager => {
    return managerRef.current;
  }, []);
  
  /**
   * Set up keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if Ctrl (or Cmd on Mac) is pressed
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      
      // Don't process if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Ctrl+Z: Undo (or Ctrl+Shift+Z on some systems)
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          // Ctrl+Shift+Z: Redo
          e.preventDefault();
          if (managerRef.current.canRedo()) {
            redo();
          }
        } else {
          // Ctrl+Z: Undo
          e.preventDefault();
          if (managerRef.current.canUndo()) {
            undo();
          }
        }
        return;
      }
      
      // Ctrl+Y: Redo
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        if (managerRef.current.canRedo()) {
          redo();
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);
  
  // State to force re-render when undo/redo stacks change
  const [stateVersion, setStateVersion] = React.useState(0);
  
  // Wrap undo/redo to trigger state update
  const wrappedUndo = useCallback((): TimelineStateSnapshot | null => {
    const result = undo();
    setStateVersion(prev => prev + 1);
    return result;
  }, [undo]);
  
  const wrappedRedo = useCallback((): TimelineStateSnapshot | null => {
    const result = redo();
    setStateVersion(prev => prev + 1);
    return result;
  }, [redo]);
  
  const wrappedRecordChange = useCallback((
    before: TimelineStateSnapshot,
    after: TimelineStateSnapshot,
    description?: string
  ): void => {
    recordChange(before, after, description);
    setStateVersion(prev => prev + 1);
  }, [recordChange]);
  
  const wrappedClear = useCallback((): void => {
    clear();
    setStateVersion(prev => prev + 1);
  }, [clear]);
  
  const wrappedInitialize = useCallback((state: TimelineStateSnapshot): void => {
    initialize(state);
    setStateVersion(prev => prev + 1);
  }, [initialize]);
  
  // Memoize context value
  const value = React.useMemo(
    () => ({
      canUndo: managerRef.current.canUndo(),
      canRedo: managerRef.current.canRedo(),
      undo: wrappedUndo,
      redo: wrappedRedo,
      recordChange: wrappedRecordChange,
      clear: wrappedClear,
      initialize: wrappedInitialize,
      getManager,
    }),
    [stateVersion, wrappedUndo, wrappedRedo, wrappedRecordChange, wrappedClear, wrappedInitialize, getManager]
  );
  
  return (
    <UndoRedoContext.Provider value={value}>
      {children}
    </UndoRedoContext.Provider>
  );
}

/**
 * Custom hook to use Undo/Redo Context
 * 
 * @returns Undo/Redo context value
 * @throws Error if used outside UndoRedoProvider
 * 
 * @example
 * const { undo, redo, canUndo, canRedo } = useUndoRedo();
 */
export function useUndoRedo(): UndoRedoContextValue {
  const context = useContext(UndoRedoContext);
  
  if (!context) {
    throw new Error('useUndoRedo must be used within UndoRedoProvider');
  }
  
  return context;
}

