import { fixBlockTimestamp } from './eventFix'
import BN from 'bn.js'
import { Bytes } from '@polkadot/types'
import { MemberId } from '@joystream/types/members'
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'
import { FindConditions } from 'typeorm'

import {
  inconsistentState,
  logger,
  extractExtrinsicArgs,
} from './common'
import { Members } from '../../generated/types'
import { MembershipEntryMethod, Membership } from 'query-node'
import { EntryMethod } from '@joystream/types/augment'

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberRegistered(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const { accountId, memberId, entryMethod } = new Members.MemberRegisteredEvent(event).data
  const { avatarUri, about, handle } = extractExtrinsicArgs(
    event,
    Members.BuyMembershipCall,
    {
      handle: 1,
      avatarUri: 2,
      about: 3,
    },
  )

  // create new membership
  const member = new Membership({
    // main data
    id: memberId.toString(),
    rootAccount: accountId.toString(),
    controllerAccount: accountId.toString(),
    handle: convertBytesToString(handle.unwrapOr(null)),
    about: convertBytesToString(about.unwrapOr(null)),
    avatarUri: convertBytesToString(avatarUri.unwrapOr(null)),
    createdInBlock: event.blockNumber,
    entry: convertEntryMethod(entryMethod),

    // fill in auto-generated fields
    createdAt: new Date(fixBlockTimestamp(event.blockTimestamp).toNumber()),
    updatedAt: new Date(fixBlockTimestamp(event.blockTimestamp).toNumber()),
  })

  // save membership
  await db.save<Membership>(member)

  // emit log event
  logger.info('Member has been registered', {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAboutText(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const { text, memberId } = extractExtrinsicArgs(event, Members.ChangeMemberAboutTextCall, {memberId: 0, text: 1})

  // load member
  const member = await db.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member about text update requested`, memberId)
  }

  // update member
  member.about = convertBytesToString(text)

  // set last update time
  member.updatedAt = new Date(fixBlockTimestamp(event.blockTimestamp).toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's about text has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAvatar(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const { uri, memberId } = extractExtrinsicArgs(event, Members.ChangeMemberAvatarCall, {memberId: 0, uri: 1})

  // load member
  const member = await db.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member avatar update requested`, memberId)
  }

  // update member
  member.avatarUri = convertBytesToString(uri)

  // set last update time
  member.updatedAt = new Date(fixBlockTimestamp(event.blockTimestamp).toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's avatar has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedHandle(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const { handle, memberId } = extractExtrinsicArgs(event, Members.ChangeMemberHandleCall, {memberId: 0, handle: 1})

  // load member
  const member = await db.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member handle update requested`, memberId)
  }

  // update member
  member.handle = convertBytesToString(handle)

  // set last update time
  member.updatedAt = new Date(fixBlockTimestamp(event.blockTimestamp).toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's avatar has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetRootAccount(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const { newRootAccount, memberId } = extractExtrinsicArgs(event, Members.SetRootAccountCall, {memberId: 0, newRootAccount: 1})

  // load member
  const member = await db.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member root account update requested`, memberId)
  }

  // update member
  member.rootAccount = newRootAccount.toString()

  // set last update time
  member.updatedAt = new Date(fixBlockTimestamp(event.blockTimestamp).toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's root has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetControllerAccount(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  // read event data
  const { newControllerAccount, memberId } = extractExtrinsicArgs(
    event,
    Members.SetControllerAccountCall,
    {memberId: 0, newControllerAccount: 1},
  )

  // load member
  const member = await db.get(Membership, { where: { id: memberId.toString() } as FindConditions<Membership> })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member controller account update requested`, memberId)
  }

  // update member
  member.controllerAccount = newControllerAccount.toString()

  // set last update time
  member.updatedAt = new Date(fixBlockTimestamp(event.blockTimestamp).toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's controller has been updated", {ids: memberId})
}

/////////////////// Helpers ////////////////////////////////////////////////////

/*
  Helper for converting Bytes type to string
*/
function convertBytesToString(b: Bytes | null): string {
  if (!b) {
    return ''
  }

  return Buffer.from(b.toU8a(true)).toString()
}

function convertEntryMethod(entryMethod: EntryMethod): MembershipEntryMethod {
  // paid membership?
  if (entryMethod.isPaid) {
    return MembershipEntryMethod.PAID
  }

  // paid membership?
  if (entryMethod.isScreening) {
    return MembershipEntryMethod.SCREENING
  }

  // paid membership?
  if (entryMethod.isGenesis) {
    return MembershipEntryMethod.GENESIS
  }

  // should never happen
  logger.error('Not implemented entry method', {entryMethod: entryMethod.toString()})
  throw 'Not implemented entry method'
}
