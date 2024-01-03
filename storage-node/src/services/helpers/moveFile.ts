import fs from 'fs'
const fsPromises = fs.promises

/**
 * Asynchronously copies `src` to `dest`. If `dest` already exists, operation is aborted
 * to avoid corrupting destination file or removal by nodejs when an error occurs after
 * it has been opened for writing.
 * Use this function instead of `rename` to move files between volumes, otherwise
 * operation fails with: EXDEV: cross-device link not permitted.
 * @param src A path to the source file.
 * @param dest A path to the destination file.
 */
export async function moveFile(src: fs.PathLike, dest: fs.PathLike): Promise<void> {
  // `COPYFILE_EXCL` flag causes the copy operation to fail if `dest` already exists.
  const { COPYFILE_EXCL } = fs.constants
  // Try to copy source file to destination
  await fsPromises.copyFile(src, dest, COPYFILE_EXCL)

  // Only if copy operation succeeds we delete the source file
  await fsPromises.unlink(src)
}
