import fs, { mkdirSync, rmSync } from 'fs'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { Utils } from '../utils'
import _ from 'lodash'
import bmp from 'bmp-js'
import nodeCleanup from 'node-cleanup'

export class TmpFileManager {
  tmpDataDir: string

  constructor(baseDir?: string) {
    this.tmpDataDir = path.join(
      baseDir || process.env.DATA_PATH || path.join(__filename, '../../../data'),
      'joystream-testing',
      uuid()
    )
    mkdirSync(this.tmpDataDir, { recursive: true })
    nodeCleanup(() => {
      rmSync(this.tmpDataDir, { recursive: true, force: true })
    })
  }

  public jsonFile(value: unknown): string {
    const tmpFilePath = path.join(this.tmpDataDir, `${uuid()}.json`)
    fs.writeFileSync(tmpFilePath, JSON.stringify(value))
    return tmpFilePath
  }

  public randomImgFile(width: number, height: number): string {
    const data = Buffer.from(Array.from({ length: width * height * 3 }, () => _.random(0, 255)))
    const rawBmp = bmp.encode({ width, height, data })
    const tmpFilePath = path.join(this.tmpDataDir, `${uuid()}.bmp`)
    fs.writeFileSync(tmpFilePath, rawBmp.data)
    return tmpFilePath
  }
}

type OutputType = 'stdout' | 'stderr'

export class ProcessManager {
  private label: string
  private stdout = ''
  private stderr = ''
  private subprocess: ChildProcessWithoutNullStreams
  private defaultOutput: OutputType
  private onStdoutListener: (chunk: Uint8Array) => void
  private onStderrListener: (chunk: Uint8Array) => void

  constructor(
    label: string,
    subprocess: ChildProcessWithoutNullStreams,
    defaultOutput: OutputType = 'stdout',
    maxOutputSize = 1024 * 1024 * 10
  ) {
    this.label = label
    this.defaultOutput = defaultOutput
    this.subprocess = subprocess
    const onDataListener = (outputType: OutputType) => (chunk: Uint8Array) => {
      const chunkStr = Buffer.from(chunk).toString()
      this[outputType] += chunkStr
      if (this[outputType].length > maxOutputSize) {
        this[outputType] = this[outputType].slice(-maxOutputSize)
      }
    }
    this.onStdoutListener = onDataListener('stdout')
    this.onStderrListener = onDataListener('stderr')

    subprocess.stdout.on('data', this.onStdoutListener)
    subprocess.stderr.on('data', this.onStderrListener)
    nodeCleanup(() => {
      console.log(this.recentOutput())
      subprocess.kill()
    })
  }

  private recentOutput() {
    const length = parseInt(process.env.SUBPROCESSES_FINAL_LOG_LENGTH || '20')
    return (
      `\n\nLast STDOUT of ${this.label}:\n ${this.stdout.split('\n').slice(-length).join('\n')}\n\n` +
      `Last STDERR of ${this.label}:\n ${this.stderr.split('\n').slice(-length).join('\n')}\n\n`
    )
  }

  kill(): void {
    this.subprocess.kill()
  }

  expectAlive(): void {
    if (this.subprocess.exitCode !== null) {
      throw new Error(`Process ${this.label} exited unexpectedly with code: ${this.subprocess.exitCode}`)
    }
  }

  expectOutput(expected: string, outputType?: OutputType): void {
    const outT = outputType || this.defaultOutput
    if (!this[outT].includes(expected)) {
      throw new Error(`Expected output: "${expected}" missing in ${this.label} process (${outputType})`)
    }
  }

  async untilOutput(
    expected: string,
    outputType?: 'stderr' | 'stdout',
    failOnExit = true,
    timeoutMs = 120000,
    waitMs = 1000
  ): Promise<void> {
    const start = Date.now()
    while (true) {
      try {
        this.expectOutput(expected, outputType)
        return
      } catch (e) {
        if (failOnExit) {
          this.expectAlive()
        }
        if (Date.now() - start + waitMs >= timeoutMs) {
          throw new Error(`untilOutput timeout reached. ${(e as Error).message}`)
        }
        await Utils.wait(waitMs)
      }
    }
  }
}
