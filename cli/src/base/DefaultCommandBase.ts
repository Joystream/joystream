import ExitCodes from '../ExitCodes'
import Command from '@oclif/command'
import inquirer, { DistinctQuestion } from 'inquirer'
import chalk from 'chalk'
import inquirerDatepicker from 'inquirer-datepicker-prompt'

/**
 * Abstract base class for pretty much all commands
 * (prevents console.log from hanging the process and unifies the default exit code)
 */
export default abstract class DefaultCommandBase extends Command {
  protected indentGroupsOpened = 0
  protected jsonPrettyIdent = ''

  log(message?: unknown, ...args: unknown[]): void {
    if (args.length) {
      console.error(message, args)
    } else {
      console.error(message)
    }
  }

  output(value: unknown): void {
    console.log(value)
  }

  openIndentGroup(): void {
    console.group()
    ++this.indentGroupsOpened
  }

  closeIndentGroup(): void {
    console.groupEnd()
    --this.indentGroupsOpened
  }

  async simplePrompt<T = unknown>(question: DistinctQuestion): Promise<T> {
    const { result } = await inquirer.prompt([
      {
        ...question,
        name: 'result',
        // prefix = 2 spaces for each group - 1 (because 1 is always added by default)
        prefix: Array.from(new Array(this.indentGroupsOpened))
          .map(() => '  ')
          .join('')
          .slice(1),
      },
    ])

    return result
  }

  async requireConfirmation(
    message = 'Are you sure you want to execute this action?',
    defaultVal = false
  ): Promise<void> {
    if (process.env.AUTO_CONFIRM === 'true' || parseInt(process.env.AUTO_CONFIRM || '')) {
      return
    }
    const { confirmed } = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message, default: defaultVal }])
    if (!confirmed) {
      this.exit(ExitCodes.OK)
    }
  }

  async requestConfirmation(
    message = 'Are you sure you want to execute this action?',
    defaultVal = false
  ): Promise<boolean> {
    if (process.env.AUTO_CONFIRM === 'true' || parseInt(process.env.AUTO_CONFIRM || '')) {
      return true
    }
    const { confirmed } = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message, default: defaultVal }])
    return confirmed
  }

  private jsonPrettyIndented(line: string): string {
    return `${this.jsonPrettyIdent}${line}`
  }

  private jsonPrettyOpen(char: '{' | '['): string {
    this.jsonPrettyIdent += '    '
    return chalk.gray(char) + '\n'
  }

  private jsonPrettyClose(char: '}' | ']'): string {
    this.jsonPrettyIdent = this.jsonPrettyIdent.slice(0, -4)
    return this.jsonPrettyIndented(chalk.gray(char))
  }

  private jsonPrettyKeyVal(key: string, val: unknown): string {
    return this.jsonPrettyIndented(chalk.magentaBright(`${key}: ${this.jsonPrettyAny(val)}`))
  }

  private jsonPrettyObj(obj: Record<string, unknown>): string {
    return (
      this.jsonPrettyOpen('{') +
      Object.keys(obj)
        .map((k) => this.jsonPrettyKeyVal(k, obj[k]))
        .join(',\n') +
      '\n' +
      this.jsonPrettyClose('}')
    )
  }

  private jsonPrettyArr(arr: unknown[]): string {
    return (
      this.jsonPrettyOpen('[') +
      arr.map((v) => this.jsonPrettyIndented(this.jsonPrettyAny(v))).join(',\n') +
      '\n' +
      this.jsonPrettyClose(']')
    )
  }

  private jsonPrettyAny(val: unknown): string {
    if (Array.isArray(val)) {
      return this.jsonPrettyArr(val)
    } else if (typeof val === 'object' && val !== null) {
      return this.jsonPrettyObj(val as Record<string, unknown>)
    } else if (typeof val === 'string') {
      return chalk.green(`"${val}"`)
    }

    // Number, boolean etc.
    return chalk.cyan(val)
  }

  jsonPrettyPrint(json: string): void {
    try {
      const parsed = JSON.parse(json)
      this.log(this.jsonPrettyAny(parsed))
    } catch (e) {
      this.log(this.jsonPrettyAny(json))
    }
  }

  async finally(err: Error): Promise<void> {
    // called after run and catch regardless of whether or not the command errored
    // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
    if (!err) this.exit(ExitCodes.OK)
    if (err && process.env.DEBUG === 'true') {
      this.log(err)
    }
    super.finally(err)
  }

  async init(): Promise<void> {
    inquirer.registerPrompt('datetime', inquirerDatepicker)
  }
}
