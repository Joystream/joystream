import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { Option } from '@polkadot/types'
import { Perbill } from '@polkadot/types/codec'
import { assert } from 'chai'
import BN from 'bn.js'
import { PalletStakingValidatorPrefs } from '@polkadot/types/lookup'

export default async function validateSucceedsInPoA({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow: validator-set')
  debug('started')
  api.enableDebugTxLogs()

  // we are in poa
  const currentEra = api.getCurrentEra()
  assert(currentEra.isNone)

  // create keys and bonding tx
  const account = (await api.createKeyPairs(1))[0].key.address

  const input = {
    stash: account,
    controller: account,
    bondAmount: new BN(100000),
  }

  const bondTx = api.tx.staking.bond(input.controller, input.bondAmount, 'Stash')
  const bondingFees = await api.estimateTxFee(bondTx, input.stash)
  await api.treasuryTransferBalance(input.stash, input.bondAmount.add(bondingFees))
  const bondingTxResult = await api.signAndSend(bondTx, input.stash)
  assert(bondingTxResult.isCompleted)

  // attempt to declare accounts as validators
  const prefs: PalletStakingValidatorPrefs = {
    commission: new Perbill(1),
    blocked: new Boolean(false), // TODO: Ask Leszek
  }
  const validateTx = api.tx.staking.validate(prefs)
  const validateingFees = await api.estimateTxFee(validateTx, input.controller)
  await api.treasuryTransferBalance(input.stash, validateingFees)
  const validateTxResult = await api.signAndSend(validateTx, input.controller)
  assert(validateTxResult.isCompleted)
}
