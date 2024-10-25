import path from 'path'
import internal from 'stream'
import { ChildProcessByStdio, spawn, exec } from 'child_process'
import { promisify } from 'util'
import logger from '../logger'

const execPromise = promisify(exec)

export class SevenZipService {
  public spawnCompressionProcess(
    archiveFilePath: string,
    compressFilePaths: string[],
    onClose: (exitCode: number) => unknown
  ): ChildProcessByStdio<null, null, internal.Readable> {
    const p7z = spawn(
      '7z',
      [
        'a', // Create an archive
        '-mx=5', // Compression level (1-9)
        '-ms=on', // Enable solid mode
        '-y', // Answer "yes" to any prompts (like overriding existing archive file etc.)
        '-bb0', // Output error messages only
        '-bd', // Disable progress indicator
        archiveFilePath, // Archive file path
        ...compressFilePaths, // Files to include in the archive
      ],
      {
        // Ignore stdin and stdout, pipe stderr
        stdio: ['ignore', 'ignore', 'pipe'],
      }
    )
    p7z.stderr.on('data', (data) => {
      logger.error(`7zip stderr: ${data}`)
    })
    p7z.on('error', (error) => {
      logger.error(`7zip spawn error: ${error.toString()}`)
    })
    // Close will be emitted even if there was an error
    p7z.on('close', onClose)
    return p7z
  }

  public async listFiles(archiveFilePath: string): Promise<string[]> {
    try {
      const { stdout } = await execPromise(`7z l -ba ${archiveFilePath} | awk '{print $NF}'`)
      const files = stdout
        .trim()
        .split('\n')
        .map((o) => path.basename(o.trim()))
      return files
    } catch (e) {
      throw new Error(`Cannot list archive files in ${archiveFilePath}: ${e.toString()}`)
    }
  }
}
