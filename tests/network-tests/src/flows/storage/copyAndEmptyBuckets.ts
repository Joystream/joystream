import urljoin from 'url-join'
import { assert } from 'chai'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { ColossusApi } from '../../../ColossusApi'
import { doubleBucketConfig } from './initStorage'
import { createJoystreamCli } from '../utils'
import { CreatedChannelData, GenerateAssetsFixture } from '../../fixtures/storage/GenerateChannelAssetsFixture'
import { CopyBagsFixture } from '../../fixtures/storage/CopyBagsFixture'
import { verifyAssets } from '../../fixtures/storage/utils'
import { EmptyBucketFixture } from '../../fixtures/storage/EmptyBucketFixture'
import { Utils } from '../../utils'

export async function copyAndEmptyBuckets({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:copyAndEmptyBuckets')
  api.enableDebugTxLogs()
  debug('Started')

  // Get storage leader key
  const [, storageLeader] = await api.getLeader('storageWorkingGroup')
  const storageLeaderKey = storageLeader.roleAccountId.toString()

  // Check preconditions:
  const activeStorageBuckets = (await api.query.storage.storageBucketById.entries())
    .filter(([, b]) => b.unwrap().operatorStatus.isStorageWorker)
    .map(([sKey, bucket]) => [sKey.args[0].toNumber(), bucket.unwrap()] as const)
  const channelBagPolicies = await api.query.storage.dynamicBagCreationPolicies('Channel')
  assert.equal(channelBagPolicies.numberOfStorageBuckets.toNumber(), 2)
  assert.equal(activeStorageBuckets.length, 2)
  assert.sameMembers(
    activeStorageBuckets.map(([id]) => id),
    [0, 1]
  )
  debug('Preconditions OK')

  // Update number of storage buckets in dynamic bag creation policy to 1
  debug('Updating channel bag creation policy (1)...')
  const updateDynamicBagPolicyTx = api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy('Channel', 1)
  await api.sendExtrinsicsAndGetResults([updateDynamicBagPolicyTx], storageLeaderKey)

  // Initialize Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // Create colossus APIs
  const bucketIds = [0, 1]
  const colossusApis = bucketIds.map((bucketId) => {
    const colossusEndpoint = doubleBucketConfig.buckets[bucketId].metadata.endpoint
    assert(colossusEndpoint, `Missing colossus endpoint for bucket ${bucketId}`)
    const colossusApi = new ColossusApi(urljoin(colossusEndpoint, 'api/v1'))
    return colossusApi
  })

  // Empty existing buckets
  debug('Emptying existing buckets...')
  for (const bucketId of bucketIds) {
    const emptyBucketFixture = new EmptyBucketFixture(api, query, { id: bucketId })
    await new FixtureRunner(emptyBucketFixture).runWithQueryNodeChecks()
  }

  // Generate different assets in both buckets
  const NUM_CHANNELS_PER_BUCKET = 3
  const allChannelsData: CreatedChannelData[] = []
  const allChannelIds: number[] = []
  let singleChannelAssetsSize = 0
  for (const bucketId of bucketIds) {
    debug(`Generating new assets for bucket ${bucketId}...`)
    // Prevent the other bucket(s) from accepting the bags
    debug(`Disabling other buckets...`)
    const disableOtherBucketsExtrinsics = bucketIds.map((otherBucketId) =>
      api.tx.storage.updateStorageBucketStatus(otherBucketId, bucketId === otherBucketId)
    )
    await api.sendExtrinsicsAndGetResults(disableOtherBucketsExtrinsics, storageLeaderKey)
    // Waiting till query node syncs the update...
    await Utils.until('QN syncs `acceptingNewBags` changes', async () => {
      const buckets = await query.storageBucketsForNewChannel()
      return buckets.length === 1 && buckets[0].id === bucketId.toString()
    })
    const generateAssetsFixture = new GenerateAssetsFixture(api, query, joystreamCli, {
      numberOfChannels: NUM_CHANNELS_PER_BUCKET,
    })
    // Proceed to create channels
    debug(`Creating channels...`)
    await new FixtureRunner(generateAssetsFixture).runWithQueryNodeChecks()
    const channelsData = generateAssetsFixture.channelsCreated
    const channelIds = channelsData.map((c) => c.id).sort()
    singleChannelAssetsSize =
      parseInt(channelsData[0].qnData?.avatarPhoto?.size || '0') +
      parseInt(channelsData[0].qnData?.coverPhoto?.size || '0')
    assert(singleChannelAssetsSize > 0)
    allChannelIds.push(...channelIds)
    allChannelsData.push(...channelsData)
    debug(`Verifying assets in Colossus nodes...`)
    await generateAssetsFixture.verifyAssets(
      colossusApis.map((colossusApi, apiBucketId) => ({
        api: colossusApi,
        channelIds: apiBucketId === bucketId ? channelIds : [],
      }))
    )
  }

  // Re-enable all buckets
  debug(`Re-enabling all buckets...`)
  const reenableBucketsExtrinsics = bucketIds.map((bucketId) =>
    api.tx.storage.updateStorageBucketStatus(bucketId, true)
  )
  await api.sendExtrinsicsAndGetResults(reenableBucketsExtrinsics, storageLeaderKey)

  // Copy bags from bucket 0 to bucket 1
  debug(`Copying bags from bucket 0 to bucket 1...`)
  const copyBagsFixture1 = new CopyBagsFixture(api, query, {
    from: [0],
    to: [1],
    expectedStorageIncrease: singleChannelAssetsSize * NUM_CHANNELS_PER_BUCKET,
  })
  await new FixtureRunner(copyBagsFixture1).runWithQueryNodeChecks()

  // Verify assets after copying
  debug(`Verifying assets in Colossus nodes...`)
  await verifyAssets(
    [
      { api: colossusApis[0], channelIds: allChannelIds.slice(0, NUM_CHANNELS_PER_BUCKET) },
      { api: colossusApis[1], channelIds: allChannelIds },
    ],
    allChannelsData
  )

  // Empty bucket 0
  debug(`Emptying bucket 0...`)
  const emptyBucket0Fixture = new EmptyBucketFixture(api, query, { id: 0 })
  await new FixtureRunner(emptyBucket0Fixture).runWithQueryNodeChecks()

  // Verify assets after emptying bucket 0
  debug(`Verifying assets in Colossus nodes...`)
  await verifyAssets(
    [
      { api: colossusApis[0], channelIds: [] },
      { api: colossusApis[1], channelIds: allChannelIds },
    ],
    allChannelsData
  )

  // Copy bags from bucket 1 to bucket 0
  debug(`Copying bags from bucket 1 to bucket 0...`)
  const copyBagsFixture2 = new CopyBagsFixture(api, query, {
    from: [1],
    to: [0],
    expectedStorageIncrease: singleChannelAssetsSize * NUM_CHANNELS_PER_BUCKET * 2,
  })
  await new FixtureRunner(copyBagsFixture2).runWithQueryNodeChecks()

  // Verify assets after copying
  debug(`Verifying assets in Colossus nodes...`)
  await verifyAssets(
    [
      { api: colossusApis[0], channelIds: allChannelIds },
      { api: colossusApis[1], channelIds: allChannelIds },
    ],
    allChannelsData
  )

  debug(`All OK, restoring previous dynamic bag policy...`)
  const restoreDynamicBagPolicyTx = api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy('Channel', 2)
  await api.sendExtrinsicsAndGetResults([restoreDynamicBagPolicyTx], storageLeaderKey)

  debug('Done')
}
