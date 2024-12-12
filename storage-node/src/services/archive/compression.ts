import path from 'path'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import logger from '../logger'

const execPromise = promisify(exec)

// Basic abstraction of algorithm-independent compression level
export type CompressionLevel = 'low' | 'medium' | 'high'

// Available compression types
export type CompressionAlgorithm = 'none' | '7zip' | 'zstd'

// Compression service base class
export abstract class CompressionService {
  protected compressionThreads?: number
  protected defaultCompressionLevel: CompressionLevel

  public constructor(compressionThreads?: number, defaultCompressionLevel?: CompressionLevel) {
    this.defaultCompressionLevel = defaultCompressionLevel || 'medium'
    this.compressionThreads = compressionThreads
  }

  public abstract compressFiles(inputFilePaths: string[], archivePath: string, level?: CompressionLevel): Promise<void>

  public abstract listFiles(archivePath: string): Promise<string[]>

  public abstract getExt(): string
}

// Compression service provider
export function getCompressionService(
  algorithm: CompressionAlgorithm,
  compressionThreads?: number,
  defaultCompressionLevel?: CompressionLevel
): CompressionService {
  if (algorithm === '7zip') {
    return new SevenZipService(compressionThreads, defaultCompressionLevel)
  }
  if (algorithm === 'zstd') {
    return new ZstdService(compressionThreads, defaultCompressionLevel)
  }
  if (algorithm === 'none') {
    return new TarService(compressionThreads, defaultCompressionLevel)
  } else {
    throw new Error(`Unrecognized compression algorithm: ${algorithm}`)
  }
}

export class TarService extends CompressionService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getCompressProgram(level?: CompressionLevel): string {
    // Use no compression by default
    return ''
  }

  protected getCompressProgramFlag(level?: CompressionLevel): string {
    const program = this.getCompressProgram(level)
    if (program) {
      return `--use-compress-program="${program}"`
    }
    return ''
  }

  public getExt(): string {
    return 'tar'
  }

  public async compressFiles(
    compressFilePaths: string[],
    archiveFilePath: string,
    level?: CompressionLevel
  ): Promise<void> {
    try {
      const useCompressProgram = this.getCompressProgramFlag(level || this.defaultCompressionLevel)
      const baseDir = path.dirname(compressFilePaths[0])
      const relativeFilePaths = compressFilePaths.map((f) => path.relative(baseDir, f))
      const { stderr } = await execPromise(
        // -c - compress
        // -f - output to file
        // -C - omit the path from file names (cd into the directory)
        `tar -cf ${archiveFilePath} ${useCompressProgram} -C ${baseDir} ${relativeFilePaths.join(' ')}`
      )
      if (stderr) {
        logger.warn(`tar process stderr: ${stderr}`)
      }
    } catch (e) {
      throw new Error(`tar process failed (exit code: ${e.exit}): ${e.toString()}`)
    }
  }

  public async listFiles(archiveFilePath: string): Promise<string[]> {
    try {
      const useCompressProgram = this.getCompressProgramFlag()
      // -t - list contents
      const { stdout } = await execPromise(`tar -tf ${archiveFilePath} ${useCompressProgram}`)
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

export class ZstdService extends TarService {
  private compressionLevelMap = new Map<CompressionLevel, number>([
    ['low', 3],
    ['medium', 9],
    ['high', 18],
  ])

  protected getCompressProgram(level?: CompressionLevel): string {
    if (level) {
      // -T# - # of threads. 0 = # of cores
      // -#  - compression level
      // -f  - force (allows overriding existing archives etc.)
      const threads = this.compressionThreads || 0
      return `zstd -T${threads} -${this.compressionLevelMap.get(level)} -f`
    } else {
      return `zstd`
    }
  }

  public getExt(): string {
    return 'tar.zst'
  }
}

export class SevenZipService extends CompressionService {
  private compressionLevelMap = new Map<CompressionLevel, number>([
    ['low', 1],
    ['medium', 5],
    ['high', 9],
  ])

  public compressFiles(compressFilePaths: string[], archiveFilePath: string, level?: CompressionLevel): Promise<void> {
    return new Promise((resolve, reject) => {
      const compressionLevel = this.compressionLevelMap.get(level || this.defaultCompressionLevel)
      const threadFlags = this.compressionThreads ? [`-mmt${this.compressionThreads}`] : []
      const p7z = spawn(
        '7z',
        [
          'a', // Create an archive
          `-mx=${compressionLevel}`, // Compression level (1-9)
          '-ms=on', // Enable solid mode
          '-y', // Answer "yes" to any prompts (like overriding existing archive file etc.)
          '-bb0', // Output error messages only
          '-bd', // Disable progress indicator
          ...threadFlags,
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
      p7z.on('close', (exitCode) => {
        if (exitCode === 0) {
          resolve()
        } else {
          reject(Error(`7z process failed with exit code: ${exitCode || 'null'}`))
        }
      })
    })
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

  public getExt(): string {
    return '7z'
  }
}
