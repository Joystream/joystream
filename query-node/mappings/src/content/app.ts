import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { ICreateApp, IUpdateApp } from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import { App, Membership } from 'query-node/dist/model'
import { MetaprotocolTxError, getById, getOneBy, logger } from '../common'

export async function processCreateAppMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  metadata: DecodedMetadataObject<ICreateApp>,
  member: Membership
): Promise<App | MetaprotocolTxError> {
  const { name, appMetadata } = metadata

  const appId = `${event.blockNumber}-${event.indexInBlock}`

  const isAppExists = await getOneBy(store, App, { name })

  if (isAppExists) {
    return MetaprotocolTxError.AppAlreadyExists
  }

  const newApp = new App({
    name,
    id: appId,
    ownerMember: member,
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

  return newApp
}

export async function processUpdateAppMessage(
  store: DatabaseManager,
  metadata: DecodedMetadataObject<IUpdateApp>,
  member: Membership
): Promise<App | MetaprotocolTxError> {
  const { appId, appMetadata } = metadata

  const app = await getById(store, App, appId, ['ownerMember'])

  if (!app) {
    return MetaprotocolTxError.AppNotFound
  }

  if (app.ownerMember.id !== member.id) {
    return MetaprotocolTxError.InvalidAppOwnerMember
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
  return app
}
