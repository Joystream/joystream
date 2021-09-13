import FileType from 'file-type'
import readChunk from 'read-chunk'

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

  const buffer = readChunk.sync(fullPath, 0, MINIMUM_FILE_CHUNK)
  const fileType = await FileType.fromBuffer(buffer)

  if (fileType === undefined) {
    return DEFAULT_FILE_INFO
  }

  return {
    mimeType: fileType.mime.toString(),
    ext: fileType.ext.toString(),
  }
}
