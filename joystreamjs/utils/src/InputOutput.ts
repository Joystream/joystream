import Ajv from 'ajv'
import axios from 'axios'
import fs from 'fs'

export type ReadFileContext = 'PATH' | 'URL'

/**
 * Read sequence of bytes from the file or remote host
 * provided path. Both `start` and `end` are inclusive
 * @param context path to the file
 * @param pathOrUrl
 * @param start starting index of the range
 * @param end ending index of the range
 * @returns byte sequence
 */
export function readBytesFromFile(
  context: ReadFileContext,
  pathOrUrl: string,
  start: number,
  end: number
): Promise<Uint8Array> {
  try {
    if (context === 'PATH') {
      return new Promise((resolve) => {
        const a = fs.createReadStream(pathOrUrl, { start, end }).on('data', (data) => {
          resolve(data as Buffer)
          a.close()
        })
      })
    }

    return axios
      .get(pathOrUrl, {
        responseType: 'arraybuffer',
        headers: {
          range: `bytes=${start}-${end}`,
        },
      })
      .then((response) => response.data)
  } catch (error) {
    throw new Error(`Failed to read input stream`)
  }
}

export async function getInputJson<T>(inputPath: string, schema?: unknown): Promise<T> {
  let content, jsonObj
  try {
    content = fs.readFileSync(inputPath).toString()
  } catch (e) {
    throw new Error(`Cannot access the input file at: ${inputPath}`)
  }
  try {
    jsonObj = JSON.parse(content)
  } catch (e) {
    throw new Error(`JSON parsing failed for file: ${inputPath}`)
  }
  if (schema) {
    await validateInput(jsonObj, schema)
  }

  return jsonObj as T
}

export async function validateInput(input: unknown, schema: unknown): Promise<void> {
  const ajv = new Ajv({ allErrors: true })
  const valid = ajv.validate(schema as any, input) as boolean
  if (!valid) {
    throw new Error(
      `Input JSON file is not valid:\n` +
        ajv.errors?.map((e) => `${e.dataPath}: ${e.message} (${JSON.stringify(e.params)})`).join('\n')
    )
  }
}
