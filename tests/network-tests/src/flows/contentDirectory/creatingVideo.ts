import { QueryNodeApi, WorkingGroups } from '../../Api'
import { CreateVideoFixture } from '../../fixtures/contentDirectoryModule'
import { VideoEntity } from 'cd-schemas/types/entities/VideoEntity'
import { assert } from 'chai'
import { Utils } from '../../utils'

export function createVideoReferencingChannelFixture(api: QueryNodeApi, title: string): CreateVideoFixture {
  const videoEntity: VideoEntity = {
    title: 'Example video',
    description: 'This is an example video',
    // We reference existing language and category by their unique properties with "existing" syntax
    // (those referenced here are part of inputs/entityBatches)
    language: { existing: { code: 'EN' } },
    category: { existing: { name: 'Education' } },
    // We use the same "existing" syntax to reference a channel by unique property (title)
    // In this case it's a channel that we created in createChannel example
    channel: { existing: { title } },
    media: {
      // We use "new" syntax to sygnalize we want to create a new VideoMedia entity that will be related to this Video entity
      new: {
        // We use "exisiting" enconding from inputs/entityBatches/VideoMediaEncodingBatch.json
        encoding: { existing: { name: 'H.263_MP4' } },
        pixelHeight: 600,
        pixelWidth: 800,
        // We create nested VideoMedia->MediaLocation->HttpMediaLocation relations using the "new" syntax
        location: { new: { httpMediaLocation: { new: { url: 'https://testnet.joystream.org/' } } } },
      },
    },
    // Here we use combined "new" and "existing" syntaxes to create Video->License->KnownLicense relations
    license: {
      new: {
        knownLicense: {
          // This license can be found in inputs/entityBatches/KnownLicenseBatch.json
          existing: { code: 'CC_BY' },
        },
      },
    },
    duration: 3600,
    thumbnailURL: '',
    isExplicit: false,
    isPublic: true,
  }
  return new CreateVideoFixture(api, videoEntity)
}

function assertVideoMatchQueriedResult(queriedVideo: any, video: VideoEntity) {
  assert(queriedVideo.title === video.title, 'Should be equal')
  assert(queriedVideo.description === video.description, 'Should be equal')
  assert(queriedVideo.duration === video.duration, 'Should be equal')
  assert(queriedVideo.thumbnailUrl === video.thumbnailURL, 'Should be equal')
  assert(queriedVideo.isExplicit === video.isExplicit, 'Should be equal')
  assert(queriedVideo.isPublic === video.isPublic, 'Should be equal')
}

export default async function createVideo(api: QueryNodeApi) {
  const channelTitle = 'Example channel'
  const createVideoHappyCaseFixture = createVideoReferencingChannelFixture(api, channelTitle)

  await createVideoHappyCaseFixture.runner(false)

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  // Perform number of full text searches on Channel title, that is a slight variation on title that one expects would return the video.
  let channelFullTextSearchResult = await api.performFullTextSearchOnChannelTitle('video')
  
  assert(channelFullTextSearchResult.data.titles.length === 1, 'Should contain exactly one entry')

  // Both channel and video title starts with `Example`
  channelFullTextSearchResult = await api.performFullTextSearchOnChannelTitle('Example')

  assert(channelFullTextSearchResult.data.titles.length === 2, 'Should contain two entries')

  // Perform number full text searches on Channel title, that absolutely should NOT return the video.
  channelFullTextSearchResult = await api.performFullTextSearchOnChannelTitle('First')

  assert(channelFullTextSearchResult.data.titles.length === 0, 'Should be empty')

  channelFullTextSearchResult = await api.performFullTextSearchOnChannelTitle('vid')

  assert(channelFullTextSearchResult.data.titles.length === 0, 'Should be empty')

  // Ensure channel contains only one video with right data
  const channelResult = await api.getChannelbyTitle(channelTitle)

  console.log(channelResult.data.channels[0].videos)
  
  assert(channelResult.data.channels[0].videos.length === 1, 'Given channel should contain exactly one video')

  assertVideoMatchQueriedResult(channelResult.data.channels[0].videos[0], createVideoHappyCaseFixture.videoEntity)

  // Perform number of full text searches on Video title, that is a slight variation on title that one expects would return the video.
  let videoFullTextSearchResult = await api.performFullTextSearchOnVideoTitle('Example')

  assert(videoFullTextSearchResult.data.titles.length === 2, 'Should contain two entries')

  videoFullTextSearchResult = await api.performFullTextSearchOnVideoTitle('Example video')

  assert(videoFullTextSearchResult.data.titles.length === 1, 'Should contain exactly one video')

  // Perform number full text searches on Video title, that absolutely should NOT return the video.
  videoFullTextSearchResult = await api.performFullTextSearchOnVideoTitle('unknown')

  assert(videoFullTextSearchResult.data.titles.length === 0, 'Should be empty')

  videoFullTextSearchResult = await api.performFullTextSearchOnVideoTitle('MediaVideo')

  assert(videoFullTextSearchResult.data.titles.length === 0, 'Should be empty')

}
