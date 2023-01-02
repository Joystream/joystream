import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { CreateApp, ICreateApp, IDeleteApp, IUpdateApp } from '@joystream/metadata-protobuf'
import { MemberId } from '@joystream/types/primitives'
import { App } from 'query-node/dist/model'
import { logger } from '../common'

export async function processCreateAppMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  message: ICreateApp
): Promise<void> {
  const { name, appMetadata } = message
  const appId = await getAppId(store, event)

  const isAppExists = await store.get(App, {
    where: {
      name: name,
    },
  })

  if (isAppExists) {
    logger.error('App already exists', { name })
    return
  }

  const newApp = new App({
    name,
    id: appId,
    createdById: memberId.toString(),
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
  await store.save<CreateApp>(newApp)
  logger.info('App has been created', { name })
}

export async function processUpdateAppMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  message: IUpdateApp
): Promise<void> {
  const { appId, appMetadata } = message

  const app = await getAppByIdAndMemberId(store, appId, memberId)

  if (!app) {
    logger.error("App doesn't exists or doesn't belong to the member", { appId, memberId: memberId.toString() })
    return
  }

  app.websiteUrl = appMetadata?.websiteUrl || app.websiteUrl
  app.useUri = appMetadata?.useUri || app.useUri
  app.smallIcon = appMetadata?.smallIcon || app.smallIcon
  app.mediumIcon = appMetadata?.mediumIcon || app.mediumIcon
  app.bigIcon = appMetadata?.bigIcon || app.bigIcon
  app.oneLiner = appMetadata?.oneLiner || app.oneLiner
  app.description = appMetadata?.description || app.description
  app.termsOfService = appMetadata?.termsOfService || app.termsOfService
  app.platforms = appMetadata?.platforms || app.platforms
  app.category = appMetadata?.category || app.category
  app.authKey = appMetadata?.authKey || app.authKey

  await store.save<App>(app)
  logger.info('App has been updated', { appId })
}

export async function processDeleteAppMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  memberId: MemberId,
  message: IDeleteApp
): Promise<void> {
  const { appId } = message

  const app = await getAppByIdAndMemberId(store, appId, memberId)

  if (!app) {
    logger.error("App doesn't exists or doesn't belong to the member", { appId, memberId: memberId.toString() })
    return
  }

  await store.remove<App>(new App({ id: appId }))
  logger.info('App has been removed', { appId })
}

async function getAppId(store: DatabaseManager, event: SubstrateEvent): Promise<string> {
  let appId = `${event.blockNumber}-${event.indexInBlock}`
  let tries = 0

  // make sure app id is unique
  while (await store.get<App>(App, { where: { id: appId } })) {
    tries++
    appId = `${event.blockNumber}-${event.indexInBlock}-${tries}`
  }

  return appId
}

async function getAppByIdAndMemberId(
  store: DatabaseManager,
  appId: string,
  memberId: MemberId
): Promise<App | undefined> {
  const app = await store.get(App, {
    where: {
      id: appId,
      createdById: memberId.toString(),
    },
  })

  return app
}
