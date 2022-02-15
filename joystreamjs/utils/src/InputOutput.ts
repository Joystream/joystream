import fs from 'fs'

/**
 * Read sequence of bytes from the file. Both `start` and `end` are inclusive
 * @param inputFilePath path to the file
 * @param start starting index of the range
 * @param end ending index of the range
 * @returns byte sequence
 */
export function getByteSequenceFromFile(inputFilePath: string, start: number, end: number): Promise<Uint8Array> {
  try {
    return new Promise((resolve) => {
      const a = fs.createReadStream(inputFilePath, { start, end }).on('data', (data) => {
        resolve(data as Buffer)
        a.close()
      })
    })
  } catch (error) {
    throw new Error(`Cannot access the input file at: ${inputFilePath}`)
  }
}
