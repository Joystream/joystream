import { IAppMetadata } from '@joystream/metadata-protobuf'
import MembershipsCommandBase from './MembershipsCommandBase'
import { Bytes } from '@polkadot/types/primitive'
import { u64 } from '@polkadot/types'
import chalk from 'chalk'

export default abstract class AppCommandBase extends MembershipsCommandBase {
  appMetadataForm = {
    description: 'App description?',
    authKey: 'App public auth key?',
    websiteUrl: 'Site URL where user can learn more about the app?',
    useUri: 'App URL?',
    platforms: 'Platforms supported by app? Format eg.: "web,mobile,native"',
    category: 'Category of the app? Format eg.: "messaging"',
    oneLiner: 'Tagline for the app?',
    termsOfService: 'Terms of service for the app?',
    bigIcon: 'Big icon URL?',
    mediumIcon: 'Medium icon URL?',
    smallIcon: 'Small icon URL?',
  }

  async promptAppMetadata(possibleFields?: Partial<IAppMetadata>): Promise<IAppMetadata> {
    this.log(chalk.green('App form initiated.'))
    this.log(chalk.yellow('To skip field just prompt empty input.'))
    this.log(`${chalk.yellow('To unset field prompt only: ')} ${chalk.magentaBright('"-"')}${chalk.yellow('.')}`)
    return Object.keys(this.appMetadataForm).reduce(async (prevPromise, key) => {
      const prev = await prevPromise
      const possibleValue = possibleFields?.[key as keyof IAppMetadata]
      if (possibleValue) {
        prev[key] = possibleValue
        return prev
      }
      const promptValue = await this.simplePrompt<string>({ message: this.appMetadataForm[key as keyof IAppMetadata] })
      if (promptValue === '') {
        return prev
      }
      prev[key] = this.processValue(key, promptValue)
      return prev
    }, Promise.resolve({} as Record<string, string | string[]>))
  }

  processValue(key: string, value: string): string | string[] {
    if (value === '-') {
      return ''
    }
    if (key === 'platforms') {
      return value.split(',').map((str: string) => str.trim())
    }
    return value
  }

  async sendRemark(message: Bytes): Promise<u64> {
    const {
      id,
      membership: { controllerAccount },
    } = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(controllerAccount)
    const result = await this.sendAndFollowNamedTx(keypair, 'members', 'memberRemark', [id, message])

    const [memberId] = this.getEvent(result, 'members', 'MemberRemarked').data

    return memberId
  }
}
