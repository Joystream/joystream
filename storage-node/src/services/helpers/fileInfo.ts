import FileType from 'file-type'
import readChunk from 'read-chunk'
import fs from 'fs'
const fsPromises = fs.promises

/**
 * Represents information about the file.
 */
export type FileInfo = {
  /**
   * File MIME-type.
   */
  mimeType: string

  /**
   * Possible file extension.
   */
  ext: string

  /**
   * File size
   */
  size: number
}

// Number in bytes to read. Minimum number for file info detection.
const MINIMUM_FILE_CHUNK = 4100

/**
 * Returns MIME-type and file extension by file content.
 *
 * @remarks
 * It reads the file chunck and tries to determine its MIME-type and extension.
 * It returns 'application/octet-stream' and 'bin' as default values.
 *
 * @param fullPath - file path
 * @returns promise with file information.
 */
export async function getFileInfo(fullPath: string): Promise<FileInfo> {
  // Default file info if nothing could be detected.
  const DEFAULT_FILE_INFO = {
    mimeType: 'application/octet-stream',
    ext: 'bin',
  }

  const buffer = await readChunk(fullPath, 0, MINIMUM_FILE_CHUNK)
  const fileType = await FileType.fromBuffer(buffer)
  const { size } = await fsPromises.stat(fullPath)

  return {
    mimeType: fileType ? fileType.mime.toString() : DEFAULT_FILE_INFO.mimeType,
    ext: fileType ? fileType.ext.toString() : DEFAULT_FILE_INFO.ext,
    size,
  }
}
