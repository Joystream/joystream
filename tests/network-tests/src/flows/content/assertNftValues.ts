import { assert } from 'chai'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import BN from 'bn.js'

export default async function assertNftValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postMigrationNftValuesAssertion')
  debug('Started')

  debug('Check that post migration NFT value are set')

  let maxNftStartingPrice = await api.getMaxNftStartingPrice()
  let maxNftBidStep = await api.getMaxNftBidStep()

  assert.equal(maxNftStartingPrice, BN(1000000000000))
  assert.equal(maxNftBidStep, BN(1000000000000))

  debug('Done')
}
