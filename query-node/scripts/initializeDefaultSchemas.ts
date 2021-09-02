/* eslint-disable import/first */
import 'reflect-metadata'

import { loadConfig } from '../generated/graphql-server/src/config'
loadConfig()

import BN from 'bn.js'
import { nanoid } from 'nanoid'
import { SnakeNamingStrategy } from '@joystream/hydra-db-utils'
import { createConnection, ConnectionOptions, getConnection, EntityManager } from 'typeorm'

import { Video } from '../generated/graphql-server/src/modules/video/video.model'
import { Channel } from '../generated/graphql-server/src/modules/channel/channel.model'
import { Block, Network } from '../generated/graphql-server/src/modules/block/block.model'
import { Category } from '../generated/graphql-server/src/modules/category/category.model'
import { VideoMedia } from '../generated/graphql-server/src/modules/video-media/video-media.model'
import { LicenseEntity } from '../generated/graphql-server/src/modules/license-entity/license-entity.model'
import { JoystreamMediaLocation, KnownLicense } from '../generated/graphql-server/src/modules/variants/variants.model'
import { KnownLicenseEntity } from '../generated/graphql-server/src/modules/known-license-entity/known-license-entity.model'
import { VideoMediaEncoding } from '../generated/graphql-server/src/modules/video-media-encoding/video-media-encoding.model'
import { MediaLocationEntity } from '../generated/graphql-server/src/modules/media-location-entity/media-location-entity.model'
import { HttpMediaLocationEntity } from '../generated/graphql-server/src/modules/http-media-location-entity/http-media-location-entity.model'
import { JoystreamMediaLocationEntity } from '../generated/graphql-server/src/modules/joystream-media-location-entity/joystream-media-location-entity.model'

function getConnectionOptions() {
  const connectionConfig: ConnectionOptions = {
    type: 'postgres',
    host: process.env.WARTHOG_DB_HOST,
    port: parseInt(process.env.WARTHOG_DB_PORT!),
    username: process.env.WARTHOG_DB_USERNAME,
    password: process.env.WARTHOG_DB_PASSWORD,
    database: process.env.WARTHOG_DB_DATABASE,
    entities: [process.env.WARTHOG_DB_ENTITIES!],
    namingStrategy: new SnakeNamingStrategy(),
    logging: true,
  }
  return connectionConfig
}

export async function main(): Promise<void> {
  console.log(`Initializing...`)
  await createConnection(getConnectionOptions())
  await getConnection().transaction(async (db: EntityManager) => {
    const id = '0'
    const createdAt = new Date()
    const createdById = '0'
    const version = 0

    // ///////// Block /////////////////
    const happenedIn = new Block({
      createdAt,
      createdById,
      version,
      block: 0,
      timestamp: new BN(Date.now()),
      network: Network.BABYLON,
    })
    await db.save<Block>(happenedIn)
    // ///////// Block /////////////////

    const commonProperties = { id, happenedIn, createdAt, createdById, version }

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
    const category = new Category({ ...commonProperties, name: `Other` })
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
    v.isExplicit = false
    v.isFeatured = false
    await db.save<Video>(v)
    // ///////// Video /////////////////
  })
}

main()
  .then(() => {
    console.log(`Done.`)
    process.exit()
  })
  .catch(console.log)
