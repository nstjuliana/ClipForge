/**
 * Undo/Redo Service
 * 
 * Manages undo/redo history for timeline operations.
 * Uses command pattern to track state changes.
 * 
 * @module services/undoRedoService
 */

import type { TimelineClip, Track } from '@/types/timeline';

/**
 * Timeline state snapshot (only mutable state, excluding view state)
 */
export interface TimelineStateSnapshot {
  clips: TimelineClip[];
  tracks: Track[];
  duration: number;
}

/**
 * Undo/Redo History Entry
 */
export interface HistoryEntry {
  /** State before the operation */
  before: TimelineStateSnapshot;
  /** State after the operation */
  after: TimelineStateSnapshot;
  /** Description of the operation */
  description: string;
}

/**
 * Undo/Redo Manager
 * 
 * Manages a history stack for undo/redo operations.
 * Stores state snapshots before and after each operation.
 */
export class UndoRedoManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxHistorySize: number = 50;
  private currentState: TimelineStateSnapshot | null = null;

  constructor(maxHistorySize: number = 50) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Record a state change
   * 
   * @param before - State before the operation
   * @param after - State after the operation
   * @param description - Description of the operation
   */
  recordChange(
    before: TimelineStateSnapshot,
    after: TimelineStateSnapshot,
    description: string = 'Operation'
  ): void {
    // Create deep clones of the state
    const beforeSnapshot = this.deepCloneSnapshot(before);
    const afterSnapshot = this.deepCloneSnapshot(after);

    // Add to undo stack
    this.undoStack.push({
      before: beforeSnapshot,
      after: afterSnapshot,
      description,
    });

    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Clear redo stack when new operation is performed
    this.redoStack = [];

    // Update current state
    this.currentState = afterSnapshot;
  }

  /**
   * Get the undo entry (state to revert to)
   */
  getUndoEntry(): HistoryEntry | null {
    if (this.undoStack.length === 0) {
      return null;
    }
    return this.undoStack[this.undoStack.length - 1];
  }

  /**
   * Perform undo and move entry to redo stack
   * 
   * @returns The state to revert to, or null if nothing to undo
   */
  undo(): TimelineStateSnapshot | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const entry = this.undoStack.pop()!;
    
    // Move to redo stack
    this.redoStack.push(entry);

    // Limit redo stack size
    if (this.redoStack.length > this.maxHistorySize) {
      this.redoStack.shift();
    }

    // Update current state to the before state
    this.currentState = this.deepCloneSnapshot(entry.before);

    return this.currentState;
  }

  /**
   * Perform redo and move entry back to undo stack
   * 
   * @returns The state to restore to, or null if nothing to redo
   */
  redo(): TimelineStateSnapshot | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const entry = this.redoStack.pop()!;
    
    // Move back to undo stack
    this.undoStack.push(entry);

    // Limit undo stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Update current state to the after state
    this.currentState = this.deepCloneSnapshot(entry.after);

    return this.currentState;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get current state
   */
  getCurrentState(): TimelineStateSnapshot | null {
    return this.currentState ? this.deepCloneSnapshot(this.currentState) : null;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = null;
  }

  /**
   * Initialize with current state (useful when loading a project)
   */
  initialize(currentState: TimelineStateSnapshot): void {
    this.clear();
    this.currentState = this.deepCloneSnapshot(currentState);
  }

  /**
   * Deep clone a timeline state snapshot
   */
  private deepCloneSnapshot(snapshot: TimelineStateSnapshot): TimelineStateSnapshot {
    return {
      clips: snapshot.clips.map(clip => ({ ...clip })),
      tracks: snapshot.tracks.map(track => ({ ...track })),
      duration: snapshot.duration,
    };
  }

  /**
   * Get undo stack size (for debugging)
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get redo stack size (for debugging)
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }
}

/**
 * Create a new UndoRedoManager instance
 */
export function createUndoRedoManager(maxHistorySize: number = 50): UndoRedoManager {
  return new UndoRedoManager(maxHistorySize);
}

