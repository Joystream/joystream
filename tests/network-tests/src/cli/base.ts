import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { Sender } from '../sender'

export type CommandResult = { stdout: string; stderr: string; out: string }

export abstract class CLI {
  protected env: Record<string, string>
  protected readonly rootPath: string
  protected readonly binPath: string
  protected defaultArgs: string[]

  constructor(rootPath: string, defaultEnv: Record<string, string> = {}, defaultArgs: string[] = []) {
    this.rootPath = rootPath
    this.binPath = path.resolve(rootPath, './bin/run')
    this.env = {
      ...process.env,
      AUTO_CONFIRM: 'true',
      ...defaultEnv,
    }
    this.defaultArgs = [...defaultArgs]
  }

  async run(command: string, args: string[] = []): Promise<CommandResult> {
    const pExecFile = promisify(execFile)
    const { env } = this
    const { stdout, stderr } = await Sender.asyncLock.acquire('tx-queue', () =>
      pExecFile(this.binPath, [command, ...this.defaultArgs, ...args], { env, cwd: this.rootPath })
    )
    return { stdout, stderr, out: stdout.trim() }
  }
}
