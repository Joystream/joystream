import fs from 'fs/promises'
import urljoin from 'url-join'
import _ from 'lodash'
import { assert } from 'chai'
import { stringifyBagId } from 'storage-node/src/services/helpers/bagTypes'
import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { Utils } from '../../utils'
import { ColossusApi } from '../../../ColossusApi'
import { doubleBucketConfig } from './initStorage'
import { createJoystreamCli } from '../utils'
import { GenerateAssetsFixture } from '../../fixtures/storage/GenerateChannelAssetsFixture'
import { SetReplicationRateFixture } from '../../fixtures/storage/SetReplicationRateFixture'

export async function setReplicationRate({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:setReplicationRate')
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
  debug('Preconditions OK')

  // Initialize Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // Generate assets
  const NUM_CHANNELS = 3
  const generateAssetsFixture = new GenerateAssetsFixture(api, query, joystreamCli, { numberOfChannels: NUM_CHANNELS })
  await new FixtureRunner(generateAssetsFixture).runWithQueryNodeChecks()
  const channelsData = generateAssetsFixture.channelsCreated
  const channelIds = channelsData.map((c) => c.id).sort()
  const singleChannelAssetsSize =
    (await fs.stat(channelsData[0].avatarPhotoPath)).size + (await fs.stat(channelsData[0].coverPhotoPath)).size

  // Verify that both storage nodes store all assets of the created channels
  const colossus1Endpoint = doubleBucketConfig.buckets[0].metadata.endpoint
  const colossus2Endpoint = doubleBucketConfig.buckets[1].metadata.endpoint
  Utils.assert(colossus1Endpoint && colossus2Endpoint, 'Missing one of 2 colossus node endpoints!')

  const colossus1Api = new ColossusApi(urljoin(colossus1Endpoint, 'api/v1'))
  const colossus2Api = new ColossusApi(urljoin(colossus2Endpoint, 'api/v1'))

  debug('Checking if both storage nodes store all assets...')
  await generateAssetsFixture.verifyAssets([
    { api: colossus1Api, channelIds },
    { api: colossus2Api, channelIds },
  ])

  // Adjust vouchers so that
  // 1. bucket0 (colossus1) has `singleChannelAssetsSize - 1` available space
  // 2. bucket1 (colossus2) has 0 available space

  // This would cause the channel bags to be REMOVED in the following order when setting replication rate to 1:
  // from bucket1, from bucket0, from bucket1 ...

  // After the change:
  // 1. bucket0 will have `singleChannelAssetsSize * (floor(NUM_CHANNELS / 2) + 1) - 1` available space
  // 2. bucket1 will have `singleChannelAssetsSize * (floor(NUM_CHANNELS / 2) + NUM_CHANNELS % 2)` available space

  // Assuming NUM_CHANNELS % 2 === 1, this would cause the channel bags to be ADDED in the following order
  // when setting replication rate back to 2:
  // to bucket1, to bucket0, to bucket1 ...

  debug('Updating storage bucket voucher limits...')
  const updateLimitTxs = [
    api.tx.storage.setStorageBucketVoucherLimits(
      0,
      singleChannelAssetsSize * (NUM_CHANNELS + 1) - 1,
      await api.query.storage.voucherMaxObjectsNumberLimit()
    ),
    api.tx.storage.setStorageBucketVoucherLimits(
      1,
      singleChannelAssetsSize * NUM_CHANNELS,
      await api.query.storage.voucherMaxObjectsNumberLimit()
    ),
  ]
  await api.sendExtrinsicsAndGetResults(updateLimitTxs, storageLeaderKey)

  // Update number of storage buckets in dynamic bag creation policy to 1
  debug('Updating channel bag creation policy (1)...')
  const updateDynamicBagPolicyTx = api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy('Channel', 1)
  await api.sendExtrinsicsAndGetResults([updateDynamicBagPolicyTx], storageLeaderKey)

  // Adjust the actual replication rate to match the new policy
  const staticBagIds = (await api.query.storage.bags.entries())
    .map(([sKey]) => sKey.args[0])
    .filter((bagId) => bagId.isStatic)
    .map(stringifyBagId)

  // Channel bags should be removed alternately starting from bucket1
  // (due to voucher configuration provided above)
  const bucket0ExpectedChannelsRemoved = channelIds.filter((c, i) => i % 2 === 1)
  const bucket1ExpectedChannelsRemoved = channelIds.filter((c, i) => i % 2 === 0)

  const expectedBagRemovalsByBucket = new Map([
    [
      0,
      bucket0ExpectedChannelsRemoved.map((id) => ({
        id: `dynamic:channel:${id}`,
        size: BigInt(singleChannelAssetsSize),
      })),
    ],
    [
      1,
      [
        // Because all static bags are empty, they will be removed from bucket1,
        // as it initally has less storage available
        ...staticBagIds.map((id) => ({ id, size: BigInt(0) })),
        ...bucket1ExpectedChannelsRemoved.map((id) => ({
          id: `dynamic:channel:${id}`,
          size: BigInt(singleChannelAssetsSize),
        })),
      ],
    ],
  ])

  debug('Setting replication rate (1)...')
  const setReplicationRateFixture = new SetReplicationRateFixture(api, query, {
    oldRate: 2,
    newRate: 1,
    expectedNumUpdates: staticBagIds.length + 3,
    expectedBuckets: Array.from(expectedBagRemovalsByBucket.entries()).map(([bucketId, bagRemovals]) => ({
      id: bucketId,
      removed: bagRemovals,
      added: [],
    })),
  })
  await new FixtureRunner(setReplicationRateFixture).run()

  debug('Checking if storage nodes only store expected assets...')
  await generateAssetsFixture.verifyAssets([
    { api: colossus1Api, channelIds: _.difference(channelIds, bucket0ExpectedChannelsRemoved) },
    { api: colossus2Api, channelIds: _.difference(channelIds, bucket1ExpectedChannelsRemoved) },
  ])

  // Update number of storage buckets in dynamic bag creation policy back to 2
  debug('Updating channel bag creation policy (2)...')
  const updateDynamicBagPolicy2Tx = api.tx.storage.updateNumberOfStorageBucketsInDynamicBagCreationPolicy('Channel', 2)
  await api.sendExtrinsicsAndGetResults([updateDynamicBagPolicy2Tx], storageLeaderKey)

  // Adjust the actual replication rate to match the new policy
  debug('Setting replication rate (2)...')
  const setReplicationRateFixture2 = new SetReplicationRateFixture(api, query, {
    oldRate: 1,
    newRate: 2,
    expectedNumUpdates: staticBagIds.length + 3,
    // bucket1 will initially have more storage avialable, so the order of adding bags to buckets will match
    // the order in which they were removed
    expectedBuckets: Array.from(expectedBagRemovalsByBucket.entries()).map(([bucketId, bagRemovals]) => ({
      id: bucketId,
      removed: [],
      added: bagRemovals,
    })),
  })
  await new FixtureRunner(setReplicationRateFixture2).run()

  debug('Checking if both storage nodes store all assets...')
  await generateAssetsFixture.verifyAssets([
    { api: colossus1Api, channelIds },
    { api: colossus2Api, channelIds },
  ])

  // Restore previous storage bucket voucher limits
  debug('Restoring previous storage bucket voucher limits...')
  const restoreLimitTxs = activeStorageBuckets.map(([bucketId, bucket]) =>
    api.tx.storage.setStorageBucketVoucherLimits(bucketId, bucket.voucher.sizeLimit, bucket.voucher.objectsLimit)
  )
  await api.sendExtrinsicsAndGetResults(restoreLimitTxs, storageLeaderKey)

  debug('Done')
}
