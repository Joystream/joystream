import { DatabaseManager, SubstrateEvent } from '@joystream/hydra-common'
import { ICreateApp, IDeleteApp, IUpdateApp } from '@joystream/metadata-protobuf'
import { DecodedMetadataObject } from '@joystream/metadata-protobuf/types'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import { App, Membership } from 'query-node/dist/model'
import { logger, inconsistentState } from '../common'

export async function processCreateAppMessage(
  store: DatabaseManager,
  event: SubstrateEvent,
  metadata: DecodedMetadataObject<ICreateApp>,
  memberId?: string
): Promise<void> {
  const { name, appMetadata } = metadata

  // memberId is required for MemberRemark, but not for LeadRemark
  if (event.method === 'MemberRemarked' && !memberId) {
    inconsistentState("memberId wasn't provided")
  }

  const appId = `${event.blockNumber}-${event.indexInBlock}`

  const isAppExists = await store.get(App, {
    where: {
      name: metadata.name,
    },
  })

  if (isAppExists) {
    inconsistentState('App already exists', { name })
  }

  const newApp = new App({
    name,
    id: appId,
    ownerMember: memberId ? new Membership({ id: memberId }) : undefined,
    isLeadOwned: !memberId,
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
  event: SubstrateEvent,
  metadata: DecodedMetadataObject<IUpdateApp>,
  memberId?: string
): Promise<void> {
  const { appId, appMetadata } = metadata

  // memberId is required for MemberRemark, but not for LeadRemark
  if (event.method === 'MemberRemarked' && !memberId) {
    inconsistentState("memberId wasn't provided")
  }

  const app = await getAppById(store, appId)

  if (!app) {
    inconsistentState("App doesn't exists", { appId })
  }

  if (memberId && app?.ownerMember?.id !== memberId) {
    inconsistentState("App doesn't belong to the member", { appId, memberId })
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
  event: SubstrateEvent,
  metadata: DecodedMetadataObject<IDeleteApp>,
  memberId?: string
): Promise<void> {
  const { appId } = metadata

  // memberId is required for MemberRemark, but not for LeadRemark
  if (event.method === 'MemberRemarked' && !memberId) {
    inconsistentState("memberId wasn't provided")
  }

  const app = await getAppById(store, appId)

  if (!app) {
    inconsistentState("App doesn't exists", { appId })
  }

  if (memberId && app?.ownerMember?.id !== memberId) {
    inconsistentState("App doesn't belong to the member", { appId, memberId })
  }

  await store.remove<App>(app)
  logger.info('App has been removed', { appId })
}

async function getAppById(store: DatabaseManager, appId: string): Promise<App | undefined> {
  const app = await store.get(App, {
    where: {
      id: appId,
    },
    relations: ['ownerMember'],
  })

  return app
}
