import fs from 'fs'

export interface FileContinousReadStreamOptions {
  end: number
  start?: number
  chunkSize?: number
  missingDataRetryTime?: number
  maxRetries?: number
}

export class FileContinousReadStream {
  private fd: number
  private position: number
  private end: number
  private chunkSize: number
  private missingDataRetryTime: number
  private maxRetries: number
  private finished: boolean

  public constructor(path: string, options: FileContinousReadStreamOptions) {
    this.fd = fs.openSync(path, 'r')
    this.position = options.start || 0
    this.end = options.end
    this.chunkSize = options.chunkSize || 1 * 1024 * 1024 // 1 MB
    this.missingDataRetryTime = options.missingDataRetryTime || 50 // 50 ms
    this.maxRetries = options.maxRetries || 2400 // 2400 retries x 50 ms = 120s timeout
    this.finished = false
  }

  private finish() {
    fs.closeSync(this.fd)
    this.finished = true
  }

  private readChunkSync(): Buffer | null {
    const chunk = Buffer.alloc(this.chunkSize)
    const readBytes = fs.readSync(this.fd, chunk, 0, this.chunkSize, this.position)
    const newPosition = this.position + readBytes
    if (readBytes < this.chunkSize && newPosition <= this.end) {
      return null
    }
    if (newPosition > this.end) {
      this.finish()
      return chunk.slice(0, readBytes)
    }
    this.position = newPosition
    return chunk
  }

  public readChunk(): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      if (this.finished) {
        return resolve(null)
      }

      const chunk = this.readChunkSync()
      if (chunk === null) {
        let retries = 0
        const interval = setInterval(() => {
          const chunk = this.readChunkSync()
          if (chunk !== null) {
            clearInterval(interval)
            return resolve(chunk)
          }
          if (++retries >= this.maxRetries) {
            clearInterval(interval)
            return reject(new Error('Max missing data retries limit reached'))
          }
        }, this.missingDataRetryTime)
      } else {
        resolve(chunk)
      }
    })
  }
}
