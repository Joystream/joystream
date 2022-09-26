import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { Option } from '@polkadot/types'
import { assert } from 'chai'
import BN from 'bn.js'

export default async function bondingSucceedsInPoA({ api, query, env }: FlowProps): Promise<void> {
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
  const fees = await api.estimateTxFee(bondTx, input.stash)
  await api.treasuryTransferBalance(input.stash, input.bondAmount.add(fees))

  const result = await api.signAndSend(bondTx, input.stash)

  assert(result.isCompleted)
}
