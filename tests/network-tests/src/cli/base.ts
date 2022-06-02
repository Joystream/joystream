import path from 'path'
import { execFile, ChildProcess, PromiseWithChild, ExecFileException, ExecException } from 'child_process'
import { promisify } from 'util'
import { Sender } from '../sender'
import { debuggingCli } from '../consts'

export type CommandResult = {
  exitCode: number
  stdout: string
  stderr: string
  out: string
}

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

  async run(
    command: string,
    customArgs: string[] = [],
    lockKeys: string[] = [],
    requireSuccess = true,
    timeoutMs = 2 * 60 * 1000 // prevents infinite execution time
  ): Promise<CommandResult> {
    const defaultError = 1

    const pExecFile = promisify(execFile)
    const { env } = this
    const { stdout, stderr, exitCode } = await Sender.asyncLock.acquire(
      lockKeys.map((k) => `nonce-${k}`),

      async () => {
        if (debuggingCli) {
          console.log(
            'Running CLI command: ',
            `AUTO_CONFIRM=true HOME="${env.HOME}"`,
            this.binPath,
            [command, ...this.getArgs(customArgs)].join(' ')
          )
        }
        try {
          // execute command and wait for std outputs (or error)
          const execOutputs = await pExecFile(this.binPath, [command, ...this.getArgs(customArgs)], {
            env,
            cwd: this.rootPath,
          })

          // return outputs and exit code
          return {
            ...execOutputs,
            exitCode: 0,
          }
        } catch (error: unknown) {
          const errorTyped = error as ExecFileException & { stdout?: string; stderr?: string }
          // escape if command's success is required
          if (requireSuccess) {
            throw error
          }

          return {
            exitCode: errorTyped.code || defaultError,
            stdout: errorTyped.stdout || '',
            stderr: errorTyped.stderr || '',
          }
        }
      },
      {
        maxOccupationTime: timeoutMs, // sets execution timeout
      } as any // needs cast to any because type `maxOccupation` is missing in types for async-lock v1.1.3
    )

    return {
      exitCode,
      stdout,
      stderr,
      out: stdout.trim(),
    }
  }
}
