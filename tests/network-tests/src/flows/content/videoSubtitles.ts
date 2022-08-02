import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { assert } from 'chai'
import { Utils } from '../../utils'
import BN from 'bn.js'
import { createJoystreamCli } from '../utils'
import { cliExamplesFolderPath, CreateContentStructureFixture, CreateMembersFixture } from '../../fixtures/content'
import { getChannelDefaults, getVideoDefaults } from '../../fixtures/content/contentTemplates'

export default async function addAndUpdateVideoSubtitles({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:add-and-update-video-subtitles')
  debug('Started')

  api.enableDebugTxLogs()

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // Import & select channel owner key
  await joystreamCli.init()

  // settings
  const channelCount = 1
  const curatorCount = 0
  const sufficientTopupAmount = new BN(1_000_000) // some very big number to cover fees of all transactions

  // create author of channels and videos as well as auction participants
  const createMembersFixture = new CreateMembersFixture(api, query, channelCount, curatorCount, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()

  const {
    members: [channelOwner],
  } = createMembersFixture.getCreatedItems()

  await joystreamCli.importAccount(channelOwner.keyringPair)

  const channelId = await joystreamCli.createChannel(getChannelDefaults(cliExamplesFolderPath), [
    '--context',
    'Member',
    '--useMemberId',
    channelOwner.memberId.toString(),
  ])

  const videoInput = getVideoDefaults(cliExamplesFolderPath, true)
  const { videoId } = await joystreamCli.createVideo(channelId, videoInput)

  // Assert video subtitles after creation
  await query.tryQueryWithTimeout(
    () => query.videoById(videoId.toString()),
    (video) => {
      Utils.assert(video, 'Video not found')
      assert.equal(video.title, videoInput.title)
      assert.equal(video.description, videoInput.description)
      assert.equal(video.isPublic, videoInput.isPublic)
      assert.equal(video.subtitles.length, videoInput.subtitles?.length)
    }
  )

  const updateVideoInput = getVideoDefaults(cliExamplesFolderPath, true)
  // override subtitles list; remove second subtitle from list
  updateVideoInput.subtitles = [updateVideoInput.subtitles![0]]
  await joystreamCli.updateVideo(videoId, updateVideoInput)

  // Assert video subtitles after creation
  await query.tryQueryWithTimeout(
    () => query.videoById(videoId.toString()),
    (video) => {
      Utils.assert(video, 'Video not found')
      assert.equal(video.title, updateVideoInput.title)
      assert.equal(video.description, updateVideoInput.description)
      assert.equal(video.isPublic, updateVideoInput.isPublic)
      assert.equal(video.subtitles.length, updateVideoInput.subtitles?.length)
    }
  )

  debug('Done')
}
