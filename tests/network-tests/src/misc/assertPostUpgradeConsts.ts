import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'

export default async function assertValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postMigrationAssertions')
  debug('Started')

  debug('Check runtime spec version')
  const version = await api.rpc.state.getRuntimeVersion()
  console.log(`Runtime Version: ${version.authoringVersion}.${version.specVersion}.${version.implVersion}`)
  assert.equal(version.specVersion.toNumber(), 6)

  debug('Check that post migration NFT value are updated')

  const maxNftStartingPrice = (await api.query.content.maxStartingPrice()).toNumber()
  const maxNftBidStep = (await api.query.content.maxBidStep()).toNumber()

  // These values are expected on production runtime profile
  assert.equal(maxNftStartingPrice, 1000000000000)
  assert.equal(maxNftBidStep, 1000000000000)

  debug('Check that post migration Forum values are updated')

  const maxForumCategories = api.consts.forum.maxCategories.toNumber()
  const maxForumSubCategories = api.consts.forum.maxSubcategories.toNumber()

  assert.equal(maxForumCategories, 40)
  assert.equal(maxForumSubCategories, 40)

  debug('Done')
}
