import { DB, SubstrateEvent } from '../../generated/indexer'
import { Channel } from '../../generated/graphql-server/src/modules/channel/channel.model'
import { Video } from '../../generated/graphql-server/src/modules/video/video.model'
import { Category } from '../../generated/graphql-server/src/modules/category/category.model'
import { VideoMedia } from '../../generated/graphql-server/src/modules/video-media/video-media.model'
import { LicenseEntity } from '../../generated/graphql-server/src/modules/license-entity/license-entity.model'
import { VideoMediaEncoding } from '../../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { MediaLocationEntity } from '../../generated/graphql-server/src/modules/media-location-entity/media-location-entity.model'
import { HttpMediaLocationEntity } from '../../generated/graphql-server/src/modules/http-media-location-entity/http-media-location-entity.model'
import { JoystreamMediaLocationEntity } from '../../generated/graphql-server/src/modules/joystream-media-location-entity/joystream-media-location-entity.model'
import { KnownLicenseEntity } from '../../generated/graphql-server/src/modules/known-license-entity/known-license-entity.model'
import { Block, Network } from '../../generated/graphql-server/src/modules/block/block.model'
import BN from 'bn.js'
import {
  JoystreamMediaLocation,
  KnownLicense,
} from '../../generated/graphql-server/src/modules/variants/variants.model'
import { nanoid } from 'nanoid'

let done = false

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function system_ExtrinsicSuccess(db: DB, event: SubstrateEvent): Promise<void> {
  if (done) {
    console.log(`Database initialization is done.`)
    process.exit()
  }

  const id = '0'

  // ///////// Block /////////////////
  const happenedIn = new Block()
  happenedIn.block = 0
  happenedIn.timestamp = new BN(Date.now())
  happenedIn.network = Network.BABYLON
  await db.save<Block>(happenedIn)
  // ///////// Block /////////////////

  const commonProperties = { id, happenedIn }

  // ///////// HttpMediaLocationEntity /////////////////
  const httpMediaLocation = new HttpMediaLocationEntity({
    ...commonProperties,
    url: '5FyzfM2YtZa75hHYCAo5evNS8bH8P4Kw8EyXqKkC5upVSDBQ',
  })
  await db.save<HttpMediaLocationEntity>(httpMediaLocation)
  // ///////// HttpMediaLocationEntity /////////////////

  // ///////// JoystreamMediaLocationEntity /////////////////
  const joyMediaLocation = new JoystreamMediaLocationEntity({
    ...commonProperties,
    dataObjectId: '5FyzfM2YtZa75hHYCAo5evNS8bH8P4Kw8EyXqKkC5upVSDBQ',
  })
  await db.save<JoystreamMediaLocationEntity>(joyMediaLocation)
  // ///////// JoystreamMediaLocationEntity /////////////////

  // ///////// KnownLicenseEntity /////////////////
  const knownLicense = new KnownLicenseEntity({ ...commonProperties, code: 'NA' })
  await db.save<KnownLicenseEntity>(knownLicense)
  // ///////// KnownLicenseEntity /////////////////

  // ///////// License /////////////////
  const k = new KnownLicense()
  k.code = knownLicense.code
  const license = new LicenseEntity({ ...commonProperties, type: k })
  await db.save<LicenseEntity>(license)
  // ///////// License /////////////////

  // ///////// MediaLocationEntity /////////////////
  const mediaLocEntity = new MediaLocationEntity({ ...commonProperties, joystreamMediaLocation: joyMediaLocation })
  await db.save<MediaLocationEntity>(mediaLocEntity)
  // ///////// MediaLocationEntity /////////////////

  // ///////// Channel /////////////////
  const channel = new Channel({
    ...commonProperties,
    handle: `Channel(0) - ${nanoid()}`,
    description: `Channel 0`,
    isPublic: false,
    isCurated: false,
  })
  await db.save<Channel>(channel)
  // ///////// Channel /////////////////

  // ///////// Category /////////////////
  const category = new Category({ ...commonProperties, name: `Category(0) ${nanoid()}` })
  await db.save<Category>(category)
  // ///////// Category /////////////////

  // ///////// VideoMediaEncoding /////////////////
  const videoMediaEncod = new VideoMediaEncoding({ ...commonProperties, name: 'NA' })
  await db.save<VideoMediaEncoding>(videoMediaEncod)
  // ///////// VideoMediaEncoding /////////////////

  // ///////// VideoMedia /////////////////
  const location = new JoystreamMediaLocation()
  location.dataObjectId = joyMediaLocation.dataObjectId
  const videoMedia = new VideoMedia({
    ...commonProperties,
    location,
    locationEntity: mediaLocEntity,
    encoding: videoMediaEncod,
    pixelHeight: 0,
    pixelWidth: 0,
  })
  await db.save<VideoMedia>(videoMedia)
  // ///////// VideoMedia /////////////////

  // ///////// Video /////////////////
  const v = new Video({ ...commonProperties })
  v.category = category
  v.channel = channel
  v.media = videoMedia
  v.license = license
  v.title = `Video(0)`
  v.description = `Video(0)`
  v.duration = 0
  v.thumbnailUrl = 'https://eu-central-1.linodeobjects.com/joystream/1.png'
  v.isPublic = false
  v.isCurated = false
  v.isExplicit = true
  v.isFeatured = false
  await db.save<Video>(v)
  // ///////// Video /////////////////

  done = true
}
