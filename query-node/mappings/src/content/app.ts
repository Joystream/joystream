import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { ICreateApp, IDeleteApp, IUpdateApp } from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import { App } from 'query-node/dist/model'
import { logger } from '../common'

export async function processCreateAppMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  metadata: DecodedMetadataObject<ICreateApp>
): Promise<void> {
  const { name, appMetadata } = metadata
  const appId = `${event.blockNumber}-${event.indexInBlock}`

  const isAppExists = await store.get(App, {
    where: {
      name: metadata?.name,
    },
  })

  if (isAppExists) {
    logger.error('App already exists', { name })
    return
  }

  const newApp = new App({
    name,
    id: appId,
    websiteUrl: appMetadata?.websiteUrl || undefined,
    useUri: appMetadata?.useUri || undefined,
    smallIcon: appMetadata?.smallIcon || undefined,
    mediumIcon: appMetadata?.mediumIcon || undefined,
    bigIcon: appMetadata?.bigIcon || undefined,
    oneLiner: appMetadata?.oneLiner || undefined,
    description: appMetadata?.description || undefined,
    termsOfService: appMetadata?.termsOfService || undefined,
    platforms: appMetadata?.platforms || undefined,
    category: appMetadata?.category || undefined,
    authKey: appMetadata?.authKey || undefined,
  })
  await store.save<App>(newApp)
  logger.info('App has been created', { name })
}

export async function processUpdateAppMessage(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUpdateApp>
): Promise<void> {
  const { appId, appMetadata } = metadata

  const app = await getAppByIdAndMemberId(store, appId)

  if (!app) {
    logger.error("App doesn't exists or doesn't belong to the member", { appId })
    return
  }

  if (appMetadata) {
    integrateMeta(app, appMetadata, [
      'websiteUrl',
      'useUri',
      'smallIcon',
      'mediumIcon',
      'bigIcon',
      'oneLiner',
      'description',
      'termsOfService',
      'platforms',
      'category',
      'authKey',
    ])
  }

  await store.save<App>(app)
  logger.info('App has been updated', { appId })
}

export async function processDeleteAppMessage(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IDeleteApp>
): Promise<void> {
  const { appId } = metadata

  const app = await getAppByIdAndMemberId(store, appId)

  if (!app) {
    logger.error("App doesn't exists or doesn't belong to the member", { appId })
    return
  }

  await store.remove<App>(app)
  logger.info('App has been removed', { appId })
}

async function getAppByIdAndMemberId(store: DatabaseManager, appId: string): Promise<App | undefined> {
  const app = await store.get(App, {
    where: {
      id: appId,
    },
  })

  return app
}
