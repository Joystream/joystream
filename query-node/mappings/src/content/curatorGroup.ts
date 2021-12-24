/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'
import { FindConditions } from 'typeorm'
import { CuratorGroup } from 'query-node/dist/model'
import { Content } from '../../generated/types'
import { inconsistentState, logger } from '../common'

export async function content_CuratorGroupCreated({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId] = new Content.CuratorGroupCreatedEvent(event).params

  // create new curator group
  const curatorGroup = new CuratorGroup({
    // main data
    id: curatorGroupId.toString(),
    curatorIds: [],
    isActive: false, // runtime creates inactive curator groups by default

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
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
    where: { id: curatorGroupId.toString() } as FindConditions<CuratorGroup>,
  })

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Non-existing curator group status set requested', curatorGroupId)
  }

  // update curator group
  curatorGroup.isActive = isActive.isTrue

  // set last update time
  curatorGroup.updatedAt = new Date(event.blockTimestamp)

  // save curator group
  await store.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator group status has been set', { id: curatorGroupId, isActive })
}

export async function content_CuratorAdded({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId, curatorId] = new Content.CuratorAddedEvent(event).params

  // load curator group
  const curatorGroup = await store.get(CuratorGroup, {
    where: { id: curatorGroupId.toString() } as FindConditions<CuratorGroup>,
  })

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Curator add to non-existing curator group requested', curatorGroupId)
  }

  // update curator group
  curatorGroup.curatorIds.push(curatorId.toNumber())

  // set last update time
  curatorGroup.updatedAt = new Date(event.blockTimestamp)

  // save curator group
  await store.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator has been added to curator group', { id: curatorGroupId, curatorId })
}

export async function content_CuratorRemoved({ store, event }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [curatorGroupId, curatorId] = new Content.CuratorAddedEvent(event).params

  // load curator group
  const curatorGroup = await store.get(CuratorGroup, {
    where: { id: curatorGroupId.toString() } as FindConditions<CuratorGroup>,
  })

  // ensure curator group exists
  if (!curatorGroup) {
    return inconsistentState('Non-existing curator group removal requested', curatorGroupId)
  }

  const curatorIndex = curatorGroup.curatorIds.indexOf(curatorId.toNumber())

  // ensure curator group exists
  if (curatorIndex < 0) {
    return inconsistentState('Non-associated curator removal from curator group requested', curatorId)
  }

  // update curator group
  curatorGroup.curatorIds.splice(curatorIndex, 1)

  // save curator group
  await store.save<CuratorGroup>(curatorGroup)

  // emit log event
  logger.info('Curator has been removed from curator group', { id: curatorGroupId, curatorId })
}
