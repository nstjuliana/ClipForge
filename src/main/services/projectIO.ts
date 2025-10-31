/**
 * Project I/O Service
 * 
 * Handles reading and writing project files to disk.
 * Saves project state including clips, timeline, and metadata.
 * 
 * @module main/services/projectIO
 */

import fs from 'fs/promises';

/**
 * Current project file format version
 */
const PROJECT_VERSION = '1.0.0';

/**
 * Project file interface (matches renderer types)
 */
interface ProjectFile {
  version: string;
  metadata: {
    name: string;
    createdAt: string;
    modifiedAt: string;
    author?: string;
    description?: string;
  };
  clips: Array<{
    id: string;
    filePath: string;
    name: string;
    duration: number;
    resolution: [number, number];
    frameRate: number;
    codec?: string;
    fileSize: number;
    thumbnailPath?: string;
    importedAt: string;
  }>;
  timeline: {
    clips: Array<{
      id: string;
      clipId: string;
      startTime: number;
      duration: number;
      inPoint: number;
      outPoint: number;
      track: number;
      layer: number;
    }>;
    playhead: number;
    isPlaying: boolean;
    zoom: number;
    scrollPosition: number;
    duration: number;
    selectedClips: string[];
  };
  exportSettings: {
    format: 'mp4' | 'webm' | 'mov';
    resolution: [number, number];
    frameRate: number;
    videoCodec: string;
    videoBitrate: number;
    audioCodec: string;
    audioBitrate: number;
  };
}

/**
 * Result type for I/O operations
 */
interface IOResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Saves a project to a file
 * 
 * Serializes project state to JSON and writes to disk.
 * Creates a backup of existing file before overwriting.
 * 
 * @param filePath - Path to save the project file
 * @param projectData - Project data to save
 * @returns Promise resolving to result with saved file path
 * 
 * @example
 * const result = await saveProject('/path/to/project.clipforge', projectData);
 * if (result.success) {
 *   console.log('Saved to:', result.data);
 * }
 */
export async function saveProject(
  filePath: string,
  projectData: ProjectFile
): Promise<IOResult<string>> {
  try {
    // Ensure file has correct extension
    if (!filePath.endsWith('.clipforge')) {
      filePath += '.clipforge';
    }
    
    // Update version and modified time
    const dataToSave: ProjectFile = {
      ...projectData,
      version: PROJECT_VERSION,
      metadata: {
        ...projectData.metadata,
        modifiedAt: new Date().toISOString(),
      },
    };
    
    // Serialize to JSON with formatting
    const jsonData = JSON.stringify(dataToSave, null, 2);
    
    // Create backup if file exists
    try {
      await fs.access(filePath);
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      // File doesn't exist, no backup needed
    }
    
    // Write file atomically (write to temp, then rename)
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, jsonData, 'utf-8');
    await fs.rename(tempPath, filePath);
    
    console.log('Project saved successfully:', filePath);
    
    return {
      success: true,
      data: filePath,
    };
  } catch (error) {
    console.error('Failed to save project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving project',
    };
  }
}

/**
 * Loads a project from a file
 * 
 * Reads and deserializes project data from disk.
 * Validates file format and version.
 * 
 * @param filePath - Path to the project file
 * @returns Promise resolving to result with project data
 * 
 * @example
 * const result = await loadProject('/path/to/project.clipforge');
 * if (result.success) {
 *   console.log('Loaded project:', result.data.metadata.name);
 * }
 */
export async function loadProject(filePath: string): Promise<IOResult<ProjectFile>> {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return {
        success: false,
        error: 'Project file not found',
      };
    }
    
    // Read file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Parse JSON
    let projectData: ProjectFile;
    try {
      projectData = JSON.parse(fileContent);
    } catch (error) {
      return {
        success: false,
        error: 'Invalid project file format (corrupted JSON)',
      };
    }
    
    // Validate basic structure
    if (!projectData.version || !projectData.metadata || !projectData.clips || !projectData.timeline) {
      return {
        success: false,
        error: 'Invalid project file structure',
      };
    }
    
    // Version check (for future migrations)
    if (projectData.version !== PROJECT_VERSION) {
      console.warn(`Project version mismatch: ${projectData.version} vs ${PROJECT_VERSION}`);
      // For MVP, we'll accept any version
    }
    
    console.log('Project loaded successfully:', filePath);
    
    return {
      success: true,
      data: projectData,
    };
  } catch (error) {
    console.error('Failed to load project:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error loading project',
    };
  }
}

/**
 * Validates if a file is a valid ClipForge project
 * 
 * @param filePath - Path to validate
 * @returns Promise resolving to true if valid
 */
export async function isValidProjectFile(filePath: string): Promise<boolean> {
  try {
    const result = await loadProject(filePath);
    return result.success;
  } catch (error) {
    return false;
  }
}

/**
 * Gets project metadata without loading full project
 * 
 * Useful for displaying project information in file browsers.
 * 
 * @param filePath - Path to the project file
 * @returns Promise resolving to project metadata
 */
export async function getProjectMetadata(filePath: string): Promise<IOResult<ProjectFile['metadata']>> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const projectData: ProjectFile = JSON.parse(fileContent);
    
    if (!projectData.metadata) {
      return {
        success: false,
        error: 'Invalid project file',
      };
    }
    
    return {
      success: true,
      data: projectData.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read metadata',
    };
  }
}

