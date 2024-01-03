import fs from 'fs'
const fsPromises = fs.promises

// Alternative to fsPromises.rename to allow moving files between volumes
export async function moveFile(src: fs.PathLike, dest: fs.PathLike): Promise<void> {
  await fsPromises.copyFile(src, dest)
  await fsPromises.unlink(src)
}
