import BN from 'bn.js'
import { Bytes } from '@polkadot/types'
import { MemberId } from '@joystream/types/members'
import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

import {
  inconsistentState,
  logger,
} from './common'
import { Members } from '../../generated/types'
import { MembershipEntryMethod, Membership } from 'query-node/src/modules/membership/membership.model'

/*
  Retrive membership from the database
*/
async function getMemberById(db: DatabaseManager, id: MemberId): Promise<Membership> {
  // load member
  const member = await db.get(Membership, { where: { id: id.toString() } })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Operation on non-existing member requested`, id)
  }
  return member
}

/*
  Helper for converting Bytes type to string
*/
function convertBytesToString(b: Bytes | null): string {
  if (!b) {
    return ''
  }

  return Buffer.from(b.toU8a(true)).toString()
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberRegistered(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // read event data
  const { accountId, memberId } = new Members.MemberRegisteredEvent(event_).data
  const { avatarUri, about, handle } = new Members.BuyMembershipCall(event_).args

  // create new membership
  const member = new Membership({
    // main data
    id: memberId.toString(),
    rootAccount: accountId.toString(),
    controllerAccount: accountId.toString(),
    handle: convertBytesToString(handle.unwrapOr(null)),
    about: convertBytesToString(about.unwrapOr(null)),
    avatarUri: convertBytesToString(avatarUri.unwrapOr(null)),
    createdInBlock: event_.blockNumber,
    // TODO: in the runtime there is currently no way to distinguish distinguish `buy_membership`(method `Paid`) and `add_screened_member`(`Screening`)
    entry: MembershipEntryMethod.PAID,

    // fill in auto-generated fields
    createdAt: new Date(event_.blockTimestamp.toNumber()),
    updatedAt: new Date(event_.blockTimestamp.toNumber()),
  })

  // save membership
  await db.save<Membership>(member)

  // emit log event
  logger.info('Member has been registered', {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAboutText(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // read event data
  const { text, memberId } = new Members.ChangeMemberAboutTextCall(event_).args

  // load member
  const member = await getMemberById(db, memberId)

  // update member
  member.about = convertBytesToString(text)

  // set last update time
  member.updatedAt = new Date(event_.blockTimestamp.toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's about text has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAvatar(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // read event data
  const { uri, memberId } = new Members.ChangeMemberAvatarCall(event_).args

  // load member
  const member = await getMemberById(db, memberId)

  // update member
  member.avatarUri = convertBytesToString(uri)

  // set last update time
  member.updatedAt = new Date(event_.blockTimestamp.toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's avatar has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedHandle(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // read event data
  const { handle, memberId } = new Members.ChangeMemberHandleCall(event_).args

  // load member
  const member = await getMemberById(db, memberId)

  // update member
  member.handle = convertBytesToString(handle)

  // set last update time
  member.updatedAt = new Date(event_.blockTimestamp.toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's avatar has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetRootAccount(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // read event data
  const { newRootAccount, memberId } = new Members.SetRootAccountCall(event_).args

  const member = await getMemberById(db, memberId)

  // update member
  member.rootAccount = newRootAccount.toString()

  // set last update time
  member.updatedAt = new Date(event_.blockTimestamp.toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's root has been updated", {ids: memberId})
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetControllerAccount(db: DatabaseManager, event_: SubstrateEvent): Promise<void> {
  // read event data
  const { newControllerAccount, memberId } = new Members.SetControllerAccountCall(event_).args

  // load member
  const member = await getMemberById(db, memberId)

  // update member
  member.controllerAccount = newControllerAccount.toString()

  // set last update time
  member.updatedAt = new Date(event_.blockTimestamp.toNumber())

  // save member
  await db.save<Membership>(member)

  // emit log event
  logger.info("Member's controller has been updated", {ids: memberId})
}
