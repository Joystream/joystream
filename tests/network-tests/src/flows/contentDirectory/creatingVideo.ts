import { QueryNodeApi, WorkingGroups } from '../../Api'
import { CreateVideoFixture } from '../../fixtures/contentDirectoryModule'
import { VideoEntity } from '@joystream/cd-schemas/types/entities/VideoEntity'
import { assert } from 'chai'

export function createVideoReferencingChannelFixture(api: QueryNodeApi): CreateVideoFixture {
  const videoEntity: VideoEntity = {
    title: 'Example video',
    description: 'This is an example video',
    // We reference existing language and category by their unique properties with "existing" syntax
    // (those referenced here are part of inputs/entityBatches)
    language: { existing: { code: 'EN' } },
    category: { existing: { name: 'Education' } },
    // We use the same "existing" syntax to reference a channel by unique property (handle)
    // In this case it's a channel that we created in createChannel example
    channel: { existing: { handle: 'Example channel' } },
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
    thumbnailUrl: '',
    isExplicit: false,
    isPublic: true,
  }
  return new CreateVideoFixture(api, videoEntity)
}

export default async function createVideo(api: QueryNodeApi) {
  const createVideoHappyCaseFixture = createVideoReferencingChannelFixture(api)

  await createVideoHappyCaseFixture.runner(false)
}
