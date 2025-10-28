/**
 * Project Type Definitions
 * 
 * Type definitions for project files and project state.
 * 
 * @module types/project
 */
import type { Clip } from './clip';
import type { TimelineState } from './timeline';

/**
 * Project file structure
 * 
 * Represents the complete project state saved to disk.
 * 
 * @interface ProjectFile
 */
export interface ProjectFile {
  /** Project file format version */
  version: string;

  /** Project metadata */
  metadata: ProjectMetadata;

  /** All imported clips */
  clips: Clip[];

  /** Timeline state */
  timeline: TimelineState;

  /** Export settings */
  exportSettings: ExportSettings;
}

/**
 * Project metadata
 * 
 * @interface ProjectMetadata
 */
export interface ProjectMetadata {
  /** Project name */
  name: string;

  /** Date created */
  createdAt: Date;

  /** Date last modified */
  modifiedAt: Date;

  /** Creator/author */
  author?: string;

  /** Project description */
  description?: string;
}

/**
 * Export settings
 * 
 * @interface ExportSettings
 */
export interface ExportSettings {
  /** Output format */
  format: 'mp4' | 'webm' | 'mov';

  /** Output resolution */
  resolution: [number, number];

  /** Frame rate */
  frameRate: number;

  /** Video codec */
  videoCodec: string;

  /** Video bitrate (in kbps) */
  videoBitrate: number;

  /** Audio codec */
  audioCodec: string;

  /** Audio bitrate (in kbps) */
  audioBitrate: number;
}

