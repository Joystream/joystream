import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membership/BuyMembershipHappyCaseFixture'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'
import { Utils } from '../../utils'
import { statSync, readFileSync } from 'fs'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'
import { createType } from '@joystream/types'
import { u8aConcat, u8aFixLength } from '@polkadot/util'
import { Configuration as ArgusApiConfig, DefaultApi as ArgusApi } from '@joystream/distributor-node-client'
import { AxiosResponse } from 'axios'

export default async function createAndUpdateChannel({ api, query, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createChannel')
  debug('Started')

  // Create channel owner membership
  const [channelOwnerKeypair] = await api.createKeyPairs(1)
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [channelOwnerKeypair.key.address])
  await new FixtureRunner(buyMembershipFixture).run()
  const memberId = buyMembershipFixture.getCreatedMembers()[0]

  // Send some funds to pay the state_bloat_bond and fees
  const channelOwnerBalance = new BN(100_000_000_000)
  await api.treasuryTransferBalance(channelOwnerKeypair.key.address, channelOwnerBalance)

  // Create and init Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // Import & select channel owner key
  await joystreamCli.init()
  await joystreamCli.importAccount(channelOwnerKeypair.key)

  // Create channel
  const avatarPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(300, 300)
  const coverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1920, 500)
  const channelInput = {
    title: 'Test channel',
    avatarPhotoPath,
    coverPhotoPath,
    description: 'This is a test channel',
    isPublic: true,
    language: 'en',
  }

  const channelId = await joystreamCli.createChannel(channelInput, [
    '--context',
    'Member',
    '--useMemberId',
    memberId.toString(),
  ])

  const expectedChannelRewardAccount = api
    .createType(
      'AccountId32',
      u8aFixLength(
        u8aConcat(
          'modl',
          'mContent',
          createType('Bytes', 'CHANNEL').toU8a(false),
          createType('u64', channelId).toU8a()
        ),
        32 * 8,
        true
      )
    )
    .toString()

  // Assert channel data after creation
  const channel = await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, channelInput.title)
      assert.equal(channel.description, channelInput.description)
      assert.equal(channel.isPublic, channelInput.isPublic)
      assert.equal(channel.language?.iso, channelInput.language)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.avatarPhoto?.isAccepted, true)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(coverPhotoPath).size)
      assert.equal(channel.coverPhoto?.isAccepted, true)
      assert.equal(channel.rewardAccount, expectedChannelRewardAccount)
    }
  )
  // Just to avoid non-null assertions later
  Utils.assert(channel && channel.avatarPhoto && channel.coverPhoto)

  // Fetch assets from Argus and verify
  const argusApiConfig = new ArgusApiConfig({
    basePath: env.DISTRIBUTOR_PUBLIC_API_URL || 'http://localhost:3334/api/v1',
  })
  const argusApi = new ArgusApi(argusApiConfig)
  const avatarPhotoDataFile = [...readFileSync(avatarPhotoPath)]
  const coverPhotoDataFile = [...readFileSync(coverPhotoPath)]
  const avatarPhotoDataArgus = [
    ...Buffer.from(
      (
        (await argusApi.publicAsset(channel.avatarPhoto.id, {
          responseType: 'arraybuffer',
        })) as AxiosResponse<ArrayBuffer>
      ).data
    ),
  ]
  const coverPhotoDataArgus = [
    ...Buffer.from(
      (
        (await argusApi.publicAsset(channel.coverPhoto.id, {
          responseType: 'arraybuffer',
        })) as AxiosResponse<ArrayBuffer>
      ).data
    ),
  ]

  assert.equal(avatarPhotoDataArgus.length, avatarPhotoDataFile.length)
  assert.equal(coverPhotoDataArgus.length, coverPhotoDataFile.length)
  assert.deepEqual(avatarPhotoDataArgus, avatarPhotoDataFile)
  assert.deepEqual(coverPhotoDataArgus, coverPhotoDataFile)

  const updatedCoverPhotoPath = joystreamCli.getTmpFileManager().randomImgFile(1820, 400)
  const updateChannelInput = {
    title: 'Test channel [UPDATED!]',
    coverPhotoPath: updatedCoverPhotoPath,
    description: 'This is a test channel [UPDATED!]',
  }

  await joystreamCli.updateChannel(channelId, updateChannelInput)

  // Assert channel data after update
  const updatedChannel = await query.tryQueryWithTimeout(
    () => query.channelById(channelId.toString()),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, updateChannelInput.title)
      assert.equal(channel.description, updateChannelInput.description)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(updatedCoverPhotoPath).size)
      assert.equal(channel.coverPhoto?.isAccepted, true)
      assert.equal(channel.rewardAccount, expectedChannelRewardAccount)
    }
  )
  debug('Done')
  // Just to avoid non-null assertions later
  Utils.assert(updatedChannel && updatedChannel.coverPhoto)

  // Fetch updated asset from Argus and verify
  const updatedCoverPhotoDataFile = [...readFileSync(updatedCoverPhotoPath)]
  const updatedCoverPhotoDataArgus = [
    ...Buffer.from(
      (
        (await argusApi.publicAsset(updatedChannel.coverPhoto.id, {
          responseType: 'arraybuffer',
        })) as AxiosResponse<ArrayBuffer>
      ).data
    ),
  ]
  assert.equal(updatedCoverPhotoDataArgus.length, updatedCoverPhotoDataFile.length)
  assert.deepEqual(updatedCoverPhotoDataArgus, updatedCoverPhotoDataFile)
}
