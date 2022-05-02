import { assert } from 'chai'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'

export default async function assertNftValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postMigrationNftValuesAssertion')
  debug('Started')

  debug('Check that post migration NFT value are set')

  const maxNftStartingPrice = await api.getMaxNftStartingPrice()
  const maxNftBidStep = await api.getMaxNftBidStep()

  assert.equal(maxNftStartingPrice, 1000000000000)
  assert.equal(maxNftBidStep, 1000000000000)

  debug('Done')
}
