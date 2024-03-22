import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { FixtureRunner } from '../../Fixture'
import { createType } from '@joystream/types'
import { createJoystreamCli } from '../utils'
import { BN } from 'bn.js'
import { assert } from 'chai'
import { ChannelCreationInputParameters } from '@joystream/cli/src/Types'
import { Utils } from '../../utils'
import { ColossusApi } from '../../../ColossusApi'
import { doubleBucketConfig } from './initStorage'
import { readFileSync } from 'fs'
import urljoin from 'url-join'

export async function storageSync({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:storageSync')
  api.enableDebugTxLogs()
  debug('Started')

  const [memberKeyPair] = await api.createKeyPairs(1)
  const memberAddr = memberKeyPair.key.address
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [memberAddr])
  await new FixtureRunner(buyMembershipFixture).run()
  const [memberId] = buyMembershipFixture.getCreatedMembers()

  const existingChannelCount = await query.getChannelsCount()
  // Create channels
  const storageBuckets = (await api.query.storage.storageBucketById.keys()).map((k) => k.args[0])
  const distributionBucketFamilies = (await api.query.storage.distributionBucketFamilyById.keys()).map((k) => k.args[0])
  const distributionBuckets = (
    await Promise.all(
      distributionBucketFamilies.map(async (familyId) => {
        return (await api.query.storage.distributionBucketByFamilyIdById.keys(familyId)).map((k) =>
          createType('PalletStorageDistributionBucketIdRecord', {
            distributionBucketFamilyId: k.args[0],
            distributionBucketIndex: k.args[1],
          })
        )
      })
    )
  ).flat()
  const expectedChannelStateBloatBond = await api.getChannelStateBloatBond()
  const expectedDataObjectStateBloatBond = await api.getDataObjectStateBloatBond()
  const numberOfBatches = 5
  const channelsPerBatch = 1000
  // Make sure the treasury has enough funds to cover the expected channel state bloat bond and some extra
  await api.treasuryTransferBalance(
    memberAddr,
    new BN(expectedChannelStateBloatBond).muln(channelsPerBatch * numberOfBatches * 1.1)
  )
  for (let i = 1; i <= numberOfBatches; ++i) {
    debug(`Creating channel batch no. ${i} (${i * channelsPerBatch} / ${channelsPerBatch * numberOfBatches})`)
    const createChannelTxBatch = Array.from({ length: channelsPerBatch }, () =>
      api.tx.content.createChannel(
        createType('PalletContentChannelOwner', { Member: memberId }),
        createType('PalletContentChannelCreationParametersRecord', {
          storageBuckets, // We assume all buckets store all channel bags
          distributionBuckets, // We assume all distribution buckets distribute all channel bags
          expectedChannelStateBloatBond,
          expectedDataObjectStateBloatBond,
          assets: null,
          meta: null,
          collaborators: [],
        })
      )
    )
    await api.prepareAccountsForFeeExpenses(memberAddr, createChannelTxBatch)
    await api.sendExtrinsicsAndGetResults(createChannelTxBatch, memberAddr)
  }

  debug('Waiting until the query node processes all new channels...')
  await query.tryQueryWithTimeout(
    () => query.getChannelsCount(),
    (r) => assert.equal(r, existingChannelCount + numberOfBatches * channelsPerBatch),
    10_000,
    50 // 10s * 50 = 500s = 8.33 minutes timeout
  )

  // Create channel w/ some data objects
  const joystreamCli = await createJoystreamCli()
  await joystreamCli.importAccount(memberKeyPair.key)

  const avatarPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(300, 300)
  const coverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1920, 500)
  const channelInput: ChannelCreationInputParameters = {
    title: 'Test channel',
    avatarPhotoPath,
    coverPhotoPath,
    description: 'This is a test channel',
    isPublic: true,
    language: 'en',
  }

  // Give member 10 JOY, to be able to create a channel through CLI
  await api.treasuryTransferBalance(memberAddr, Utils.joy(10))

  // Create channel through CLI
  const channelId = await joystreamCli.createChannel(channelInput, [
    '--context',
    'Member',
    '--useMemberId',
    memberId.toString(),
  ])

  const channel = await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (r) => Utils.assert(r, `Cannot find channel ${channelId}`)
  )

  const colossus1Endpoint = doubleBucketConfig.buckets[0].metadata.endpoint
  const colossus2Endpoint = doubleBucketConfig.buckets[1].metadata.endpoint
  Utils.assert(channel && channel.coverPhoto && channel.avatarPhoto, `Channel ${channelId} has missing assets`)
  Utils.assert(colossus1Endpoint && colossus2Endpoint, `Colossus endpoints not set`)

  debug('Giving nodes 300 seconds to sync...')
  await Utils.wait(300_000)

  // Verify that both storage nodes have the right assets
  const colossus1Api = new ColossusApi(urljoin(colossus1Endpoint, 'api/v1'))
  const colossus2Api = new ColossusApi(urljoin(colossus2Endpoint, 'api/v1'))

  await colossus1Api.fetchAndVerifyAsset(channel.coverPhoto.id, readFileSync(coverPhotoPath), 'image/bmp')
  await colossus2Api.fetchAndVerifyAsset(channel.coverPhoto.id, readFileSync(coverPhotoPath), 'image/bmp')

  await colossus1Api.fetchAndVerifyAsset(channel.avatarPhoto.id, readFileSync(avatarPhotoPath), 'image/bmp')
  await colossus2Api.fetchAndVerifyAsset(channel.avatarPhoto.id, readFileSync(avatarPhotoPath), 'image/bmp')

  debug('Done')
}
