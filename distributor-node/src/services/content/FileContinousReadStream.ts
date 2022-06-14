import { Readable } from 'stream'
import fs from 'fs'

export interface FileContinousReadStreamOptions {
  end: number
  start?: number
  chunkSize?: number
  missingDataRetryTime?: number
  maxRetries?: number
}

export class FileContinousReadStream extends Readable {
  private fd: number
  private position: number
  private lastByte: number
  private missingDataRetryTime: number
  private maxRetries: number
  private finished: boolean
  private interval: NodeJS.Timeout | undefined

  public constructor(path: string, options: FileContinousReadStreamOptions) {
    super({
      highWaterMark: options.chunkSize || 1 * 1024 * 1024, // default: 1 MB
    })
    this.fd = fs.openSync(path, 'r')
    this.position = options.start || 0
    this.lastByte = options.end
    this.missingDataRetryTime = options.missingDataRetryTime || 50 // 50 ms
    this.maxRetries = options.maxRetries || 2400 // 2400 retries x 50 ms = 120s timeout
    this.finished = false
  }

  private finish() {
    this.finished = true
  }

  private readChunkSync(bytesN: number): Buffer | null {
    const chunk = Buffer.alloc(bytesN)
    const readBytes = fs.readSync(this.fd, chunk, 0, bytesN, this.position)
    const newPosition = this.position + readBytes
    if (readBytes < bytesN && newPosition <= this.lastByte) {
      return null
    }
    if (newPosition > this.lastByte) {
      this.finish()
      return chunk.slice(0, readBytes)
    }
    this.position = newPosition
    return chunk
  }

  // Reason: https://nodejs.org/docs/latest/api/stream.html#stream_implementing_a_readable_stream
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _read(bytesN: number): void {
    if (this.finished) {
      this.push(null)
      return
    }
    const chunk = this.readChunkSync(bytesN)
    if (chunk === null) {
      let retries = 0
      const interval = setInterval(() => {
        const chunk = this.readChunkSync(bytesN)
        if (chunk !== null) {
          clearInterval(interval)
          return this.push(chunk)
        }
        if (++retries >= this.maxRetries) {
          clearInterval(interval)
          this.destroy(new Error('Max missing data retries limit reached'))
        }
      }, this.missingDataRetryTime)
      this.interval = interval
    } else {
      this.push(chunk)
    }
  }

  // Reason: https://nodejs.org/docs/latest/api/stream.html#stream_implementing_a_readable_stream
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _destroy(): void {
    if (this.interval) {
      clearInterval(this.interval)
    }
    fs.closeSync(this.fd)
  }
}
