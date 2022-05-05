import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'

export default async function assertValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postMigrationAssertions')
  debug('Started')

  debug('Check that post migration NFT value are set')

  const maxNftStartingPrice = (await api.query.content.maxStartingPrice()).toNumber()
  const maxNftBidStep = (await api.query.content.maxBidStep()).toNumber()

  // These values are expected on production runtime profile
  assert.equal(maxNftStartingPrice, 1000000000000)
  assert.equal(maxNftBidStep, 1000000000000)

  // Forum categories max values
  const maxForumCategories = api.consts.forum.maxCategories.toNumber()
  const maxForumSubCategories = api.consts.forum.maxSubcategories.toNumber()

  assert.equal(maxForumCategories, 40)
  assert.equal(maxForumSubCategories, 40)

  debug('Done')
}
