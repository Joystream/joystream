/*
eslint-disable @typescript-eslint/naming-convention
*/
import { DatabaseManager, EventContext, StoreContext } from '@joystream/hydra-common'
import { BTreeSet } from '@polkadot/types'
import { Curator, CuratorAgentPermissions, CuratorGroup } from 'query-node/dist/model'
import { getById, getByIdOrFail, logger } from '../common'
import { mapAgentPermission } from './utils'
// Joystream types
import { PalletContentIterableEnumsChannelActionPermission } from '@polkadot/types/lookup'
import {
  Content_CuratorAddedEvent_V1001 as CuratorAddedEvent_V1001,
  Content_CuratorGroupCreatedEvent_V1001 as CuratorGroupCreatedEvent_V1001,
  Content_CuratorGroupStatusSetEvent_V1001 as CuratorGroupStatusSetEvent_V1001,
  Content_CuratorRemovedEvent_V1001 as CuratorRemovedEvent_V1001,
} from '../../generated/types'

async function createCurator(store: DatabaseManager, curatorId: string): Promise<Curator> {
  const curator = new Curator({
    id: curatorId,

    curatorGroups: [],
  })

  await store.save<Curator>(curator)

  return curator
}

async function ensureCurator(store: DatabaseManager, curatorId: string): Promise<Curator> {
  return (await getById(store, Curator, curatorId)) || (await createCurator(store, curatorId))
}

export async function content_CuratorGroupCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId] = new CuratorGroupCreatedEvent_V1001(event).params

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
  const [curatorGroupId, isActive] = new CuratorGroupStatusSetEvent_V1001(event).params

  // load curator group
  const curatorGroup = await getByIdOrFail(store, CuratorGroup, curatorGroupId.toString())

  // update curator group
  curatorGroup.isActive = isActive.isTrue

  // save curator group
  await store.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator group status has been set', { id: curatorGroupId, isActive })
}

export async function content_CuratorAdded({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId, curatorId, permissions] = new CuratorAddedEvent_V1001(event).params

  // load curator group
  const curatorGroup = await getByIdOrFail(store, CuratorGroup, curatorGroupId.toString(), ['curators'])

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
  const [curatorGroupId, curatorId] = new CuratorRemovedEvent_V1001(event).params

  // load curator group
  const curatorGroup = await getByIdOrFail(store, CuratorGroup, curatorGroupId.toString(), ['curators'])

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
