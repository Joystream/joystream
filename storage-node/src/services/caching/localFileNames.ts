import fs from 'fs'
const fsPromises = fs.promises
/**
 * Returns file names from the local directory, ignoring subfolders.
 *
 * @param directory - local directory to get file names from
 */
export async function getLocalFileNames(directory: string): Promise<string[]> {
  const result = await fsPromises.readdir(directory, { withFileTypes: true })
  return result.filter((entry) => entry.isFile()).map((entry) => entry.name)
}
