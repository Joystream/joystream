import ApiCommandBase from './ApiCommandBase'
import { flags } from '@oclif/command'
import { KEYRING_OPTIONS } from './AccountsCommandBase'
import { createTestPairs } from '@polkadot/keyring/testingPairs'
import { KeyringPair } from '@polkadot/keyring/types'
import { formatBalance } from '@polkadot/util'
import BN from 'bn.js'
import _ from 'lodash'
import { PalletStorageDataObjectCreationParameters } from '@polkadot/types/lookup'
import { createType } from '@joystream/types'
import chalk from 'chalk'

const DEFAULT_JOY_PRICE = 6 // 6 cents

type TestPairs = {
  alice: KeyringPair
  bob: KeyringPair
}

type SingleValueProfile = {
  hapi: string
  joy: number
  usd: number
}

type ProfileRecord = Record<string, SingleValueProfile>

type FullProfile = {
  costs: ProfileRecord
  returns: ProfileRecord
  diff: SingleValueProfile
}

/**
 * Abstract base class for fee-profile commands.
 */
export default abstract class FeeProfileCommandBase extends ApiCommandBase {
  pairs: TestPairs = createTestPairs(KEYRING_OPTIONS) as TestPairs
  joyPrice = DEFAULT_JOY_PRICE

  static flags = {
    joyPrice: flags.integer({
      required: false,
      char: 'j',
      description: 'Joy price in USD cents for estimating costs in USD',
      default: DEFAULT_JOY_PRICE,
    }),
  }

  async init(): Promise<void> {
    await super.init()
    const { joyPrice } = this.parse(this.constructor as typeof FeeProfileCommandBase).flags
    this.log('Assumed JOY price: ' + chalk.greenBright(`$${_.round(joyPrice / 100, 4)}`))
    this.joyPrice = joyPrice
  }

  asJoy(hapi: BN): number {
    return _.round(Number(formatBalance(hapi, { forceUnit: 'JOY', withUnit: false }).replace(',', '')), 4)
  }

  asUsd(hapi: BN): number {
    const joy = this.asJoy(hapi)
    return _.round((joy * this.joyPrice) / 100, 4)
  }

  mockAsset(sizeMB: number): PalletStorageDataObjectCreationParameters {
    return createType('PalletStorageDataObjectCreationParameters', {
      size_: sizeMB * 1024 * 1024,
      ipfsContentId: _.repeat('x', 46),
    })
  }

  generateValueProfile(hapi: BN): SingleValueProfile {
    return {
      hapi: hapi.toString(),
      joy: this.asJoy(hapi),
      usd: this.asUsd(hapi),
    }
  }

  generateProfileRecord(values: Record<string, BN>): ProfileRecord {
    values.total = _.reduce(values, (total, curr) => total.add(curr), new BN(0))
    return _.mapValues(values, (hapi) => this.generateValueProfile(hapi))
  }

  profile(costs: Record<string, BN>, returns: Record<string, BN> = {}): void {
    const costsProfile = this.generateProfileRecord(costs)
    const returnsProfile = this.generateProfileRecord(returns)
    const diff = this.generateValueProfile(new BN(returnsProfile.total.hapi).sub(new BN(costsProfile.total.hapi)))
    const output: FullProfile = {
      costs: costsProfile,
      returns: returnsProfile,
      diff,
    }
    this.output(output)
  }
}
