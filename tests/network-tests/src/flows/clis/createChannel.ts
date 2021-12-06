import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { JoystreamCLI } from '../../cli/joystream'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { BN } from '@polkadot/util'
import { FixtureRunner } from '../../Fixture'
import { TmpFileManager } from '../../cli/utils'
import { assert } from 'chai'
import { Utils } from '../../utils'
import { statSync } from 'fs'

export default async function createChannel({ api, env, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createChannel')
  debug('Started')

  // Create channel owner membership
  const [channelOwnerKeypair] = await api.createKeyPairs(1)
  const paidTermId = api.createPaidTermId(new BN(+(env.MEMBERSHIP_PAID_TERMS || 0)))
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, [channelOwnerKeypair.key.address], paidTermId)
  await new FixtureRunner(buyMembershipFixture).run()

  // Send some funds to pay the deletion_prize
  const channelOwnerBalance = api.consts.storage.dataObjectDeletionPrize.muln(2)
  await api.treasuryTransferBalance(channelOwnerKeypair.key.address, channelOwnerBalance)

  // Create CLI's
  const tmpFileManager = new TmpFileManager()
  const joystreamCli = new JoystreamCLI(tmpFileManager)

  // Init CLI, import & select channel owner key
  await joystreamCli.init()
  await joystreamCli.importKey(channelOwnerKeypair.key)
  await joystreamCli.chooseKey(channelOwnerKeypair.key.address)

  // Create channel
  const avatarPhotoPath = tmpFileManager.randomImgFile(300, 300)
  const coverPhotoPath = tmpFileManager.randomImgFile(1920, 500)
  const channelInput = {
    title: 'Test channel',
    avatarPhotoPath,
    coverPhotoPath,
    description: 'This is a test channel',
    isPublic: true,
    language: 'en',
    rewardAccount: channelOwnerKeypair.key.address,
  }
  const { out: createChannelOut } = await joystreamCli.createChannel(channelInput, ['--context', 'Member'])

  const channelIdMatch = /Channel with id ([0-9]+) successfully created/.exec(createChannelOut)
  if (!channelIdMatch) {
    throw new Error(`No channel id found in output:\n${createChannelOut}`)
  }
  const [, channelId] = channelIdMatch

  await query.tryQueryWithTimeout(
    () => query.channelById(channelId),
    (channel) => {
      Utils.assert(channel, 'Channel not found')
      assert.equal(channel.title, channelInput.title)
      assert.equal(channel.description, channelInput.description)
      assert.equal(channel.isPublic, channelInput.isPublic)
      assert.equal(channel.language?.iso, channelInput.language)
      assert.equal(channel.rewardAccount, channelInput.rewardAccount)
      assert.equal(channel.avatarPhoto?.type.__typename, 'DataObjectTypeChannelAvatar')
      assert.equal(channel.avatarPhoto?.size, statSync(avatarPhotoPath).size)
      assert.equal(channel.coverPhoto?.type.__typename, 'DataObjectTypeChannelCoverPhoto')
      assert.equal(channel.coverPhoto?.size, statSync(coverPhotoPath).size)
    }
  )

  debug('Done')
}
