import fs from 'fs'

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
