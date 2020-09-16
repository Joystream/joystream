import BN from 'bn.js'
import ExitCodes from '../ExitCodes'
import { decodeAddress } from '@polkadot/util-crypto'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { CLIError } from '@oclif/errors'

export function validateAddress(address: string, errorMessage = 'Invalid address'): void {
  try {
    decodeAddress(address)
  } catch (e) {
    throw new CLIError(errorMessage, { exit: ExitCodes.InvalidInput })
  }
}

export function checkBalance(accBalances: DeriveBalancesAll, requiredBalance: BN): void {
  if (requiredBalance.gt(accBalances.availableBalance)) {
    throw new CLIError('Not enough balance available', { exit: ExitCodes.InvalidInput })
  }
}
