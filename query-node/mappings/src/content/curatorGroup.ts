/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { Curator, CuratorGroup, CuratorAgentPermissions } from 'query-node/dist/model'
import { Content } from '../../generated/types'
import { inconsistentState, logger } from '../common'
import { mapAgentPermission } from './utils'
import { BTreeSet } from '@polkadot/types'
// Joystream types
import { PalletContentIterableEnumsChannelActionPermission } from '@polkadot/types/lookup'

async function getCurator(store: DatabaseManager, curatorId: string): Promise<Curator | undefined> {
  const existingCurator = await store.get(Curator, {
    where: { id: curatorId.toString() },
  })

  return existingCurator
}

async function createCurator(store: DatabaseManager, curatorId: string): Promise<Curator> {
  const curator = new Curator({
    id: curatorId,

    curatorGroups: [],
  })

  await store.save<Curator>(curator)

  return curator
}

async function ensureCurator(store: DatabaseManager, curatorId: string): Promise<Curator> {
  return (await getCurator(store, curatorId)) || (await createCurator(store, curatorId))
}

export async function content_CuratorGroupCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId] = new Content.CuratorGroupCreatedEvent(event).params

  // create new curator group
  const curatorGroup = new CuratorGroup({
    // main data
    id: curatorGroupId.toString(),
    curators: [],
    isActive: false, // runtime creates inactive curator groups by default
  })

  // save curator group
  await store.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator group has been created', { id: curatorGroupId })
}

export async function content_CuratorGroupStatusSet({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId, isActive] = new Content.CuratorGroupStatusSetEvent(event).params

  // load curator group
  const curatorGroup = await store.get(CuratorGroup, {
    where: { id: curatorGroupId.toString() },
  })

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Non-existing curator group status set requested', curatorGroupId)
  }

  // update curator group
  curatorGroup.isActive = isActive.isTrue

  // save curator group
  await store.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator group status has been set', { id: curatorGroupId, isActive })
}

export async function content_CuratorAdded({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId, curatorId, permissions] = new Content.CuratorAddedEvent(event).params

  // load curator group
  const curatorGroup = await store.get(CuratorGroup, {
    where: { id: curatorGroupId.toString() },
    relations: ['curators'],
  })

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Curator add to non-existing curator group requested', curatorGroupId)
  }

  // load curator
  const curator = await ensureCurator(store, curatorId.toString())

  // save curator group
  await store.save<CuratorGroup>(curatorGroup)

  // update curator permissions
  await updateCuratorAgentPermissions(store, curatorGroup, curator, permissions)

  // emit log event
  logger.info('Curator has been added to curator group', { id: curatorGroupId, curatorId })
}

export async function content_CuratorRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId, curatorId] = new Content.CuratorRemovedEvent(event).params

  // load curator group
  const curatorGroup = await store.get(CuratorGroup, {
    where: { id: curatorGroupId.toString() },
    relations: ['curators'],
  })

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Non-existing curator group removal requested', curatorGroupId)
  }

  // load curator
  const curator = await ensureCurator(store, curatorId.toString())

  // update curator permissions
  await updateCuratorAgentPermissions(store, curatorGroup, curator)

  // emit log event
  logger.info('Curator has been removed from curator group', { id: curatorGroupId, curatorId })
}

async function updateCuratorAgentPermissions(
  store: DatabaseManager,
  curatorGroup: CuratorGroup,
  curator: Curator,
  permissions?: BTreeSet<PalletContentIterableEnumsChannelActionPermission>
) {
  // safest way to update permission is to delete existing and creating new ones

  // delete existing agent permissions
  const existingAgentPermissions = await store.getMany(CuratorAgentPermissions, {
    where: {
      curatorGroup: { id: curatorGroup.id.toString() },
      curator: { id: curator.id.toString() },
    },
  })
  for (const agentPermissions of existingAgentPermissions) {
    await store.remove(agentPermissions)
  }

  const permissionsArray = Array.from(permissions || [])

  // create new records for privledged members
  const curatorAgentPermissions = new CuratorAgentPermissions({
    curatorGroup: new CuratorGroup({ id: curatorGroup.id.toString() }),
    curator: new Curator({ id: curator.id.toString() }),
    permissions: permissionsArray.map(mapAgentPermission),
  })

  await store.save(curatorAgentPermissions)
}
