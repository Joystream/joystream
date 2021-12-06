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
      FORCE_COLOR: '0',
      ...defaultEnv,
    }
    this.defaultArgs = [...defaultArgs]
  }

  protected getArgs(customArgs: string[]): string[] {
    return [...this.defaultArgs, ...customArgs]
  }

  protected getFlagStringValue(args: string[], flag: string, alias?: string): string | undefined {
    const flagIndex = args.lastIndexOf(flag)
    const aliasIndex = alias ? args.lastIndexOf(alias) : -1
    const flagOrAliasIndex = Math.max(flagIndex, aliasIndex)
    if (flagOrAliasIndex === -1) {
      return undefined
    }
    const nextArg = args[flagOrAliasIndex + 1]
    return nextArg
  }

  async run(command: string, customArgs: string[] = [], lockKeys: string[] = []): Promise<CommandResult> {
    const pExecFile = promisify(execFile)
    const { env } = this
    const { stdout, stderr } = await Sender.asyncLock.acquire(
      lockKeys.map((k) => `nonce-${k}`),
      () =>
        pExecFile(this.binPath, [command, ...this.getArgs(customArgs)], {
          env,
          cwd: this.rootPath,
        })
    )
    return { stdout, stderr, out: stdout.trim() }
  }
}
