import DefaultCommandBase from './DefaultCommandBase'
import { IAppMetadata } from '@joystream/metadata-protobuf'
import { appCreationForm } from '../commands/apps/helpers'

export default abstract class AppCommandBase extends DefaultCommandBase {
  async promptAppMetadata(possibleFields?: Partial<IAppMetadata>): Promise<IAppMetadata> {
    return Object.keys(appCreationForm).reduce(async (prevPromise, key) => {
      const prev = await prevPromise
      const possibleValue = possibleFields?.[key as keyof IAppMetadata]
      if (possibleValue) {
        prev[key] = possibleValue
        return prev
      }
      const promptValue = await this.simplePrompt<string>({ message: appCreationForm[key as keyof IAppMetadata] })
      prev[key] = this.processValue(key, promptValue)
      return prev
    }, Promise.resolve({} as Record<string, string | string[]>))
  }

  processValue(key: string, value: string): string | string[] {
    if (key === 'platforms') {
      return value.split(',').map((str: string) => str.trim())
    }
    return value
  }
}
