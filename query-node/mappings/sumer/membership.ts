import { Bytes } from '@polkadot/types'
import { MemberId } from '@joystream/types/members'
import { SubstrateEvent, EventContext, StoreContext } from '@joystream/hydra-common'

import { bytesToString, inconsistentState, logger, extractExtrinsicArgs, extractSudoCallParameters } from '../common'
import { Members } from '../generated/types'
import { MembershipEntryMethod, Membership } from 'query-node/dist/model'
import { EntryMethod } from '@joystream/types/augment'

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberRegistered({ event, store }: EventContext & StoreContext): Promise<void> {
  // read event data
  const [memberId, accountId, entryMethod] = new Members.MemberRegisteredEvent(event).params
  const { avatarUri, about, handle } = extractExtrinsicArgs(event, Members.BuyMembershipCall, {
    handle: 1,
    avatarUri: 2,
    about: 3,
  })

  // create new membership
  const member = new Membership({
    // main data
    id: memberId.toString(),
    rootAccount: accountId.toString(),
    controllerAccount: accountId.toString(),
    // Handle is required by the runtime during registration. Lack of it will throw an error
    handle: bytesToString(handle.unwrap()),
    about: about.isSome ? bytesToString(about.unwrap()) : undefined,
    avatarUri: avatarUri.isSome ? bytesToString(avatarUri.unwrap()) : undefined,
    createdInBlock: event.blockNumber,
    entry: convertEntryMethod(entryMethod),

    // fill in auto-generated fields
    createdAt: new Date(event.blockTimestamp),
    updatedAt: new Date(event.blockTimestamp),
  })

  // save membership
  await store.save<Membership>(member)

  // emit log event
  logger.info('Member has been registered', { ids: memberId })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAboutText({ event, store }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { text, memberId } = isUpdateMembershipExtrinsic(event)
    ? unpackUpdateMembershipOptions(
        extractExtrinsicArgs(event, Members.UpdateMembershipCall, { memberId: 0, about: 3 })
      )
    : extractExtrinsicArgs(event, Members.ChangeMemberAboutTextCall, { memberId: 0, text: 1 })

  // load member
  const member = await store.get(Membership, { where: { id: memberId.toString() } })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member about text update requested`, memberId)
  }

  // update member
  member.about = bytesToString(text)

  // set last update time
  member.updatedAt = new Date(event.blockTimestamp)

  // save member
  await store.save<Membership>(member)

  // emit log event
  logger.info("Member's about text has been updated", { ids: memberId })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedAvatar({ event, store }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { uri, memberId } = isUpdateMembershipExtrinsic(event)
    ? unpackUpdateMembershipOptions(
        extractExtrinsicArgs(event, Members.UpdateMembershipCall, { memberId: 0, avatarUri: 2 })
      )
    : extractExtrinsicArgs(event, Members.ChangeMemberAvatarCall, { memberId: 0, uri: 1 })

  // load member
  const member = await store.get(Membership, { where: { id: memberId.toString() } })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member avatar update requested`, memberId)
  }

  // update member
  member.avatarUri = bytesToString(uri)

  // set last update time
  member.updatedAt = new Date(event.blockTimestamp)

  // save member
  await store.save<Membership>(member)

  // emit log event
  logger.info("Member's avatar has been updated", { ids: memberId })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberUpdatedHandle({ event, store }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { handle, memberId } = isUpdateMembershipExtrinsic(event)
    ? unpackUpdateMembershipOptions(
        extractExtrinsicArgs(event, Members.UpdateMembershipCall, { memberId: 0, handle: 1 })
      )
    : extractExtrinsicArgs(event, Members.ChangeMemberHandleCall, { memberId: 0, handle: 1 })

  // load member
  const member = await store.get(Membership, { where: { id: memberId.toString() } })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member handle update requested`, memberId)
  }

  // update member
  member.handle = bytesToString(handle)

  // set last update time
  member.updatedAt = new Date(event.blockTimestamp)

  // save member
  await store.save<Membership>(member)

  // emit log event
  logger.info("Member's avatar has been updated", { ids: memberId })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetRootAccount({ event, store }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { newRootAccount, memberId } = extractExtrinsicArgs(event, Members.SetRootAccountCall, {
    memberId: 0,
    newRootAccount: 1,
  })

  // load member
  const member = await store.get(Membership, { where: { id: memberId.toString() } })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member root account update requested`, memberId)
  }

  // update member
  member.rootAccount = newRootAccount.toString()

  // set last update time
  member.updatedAt = new Date(event.blockTimestamp)

  // save member
  await store.save<Membership>(member)

  // emit log event
  logger.info("Member's root has been updated", { ids: memberId })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function members_MemberSetControllerAccount({ event, store }: EventContext & StoreContext): Promise<void> {
  // read event data
  const { newControllerAccount, memberId } = extractExtrinsicArgs(event, Members.SetControllerAccountCall, {
    memberId: 0,
    newControllerAccount: 1,
  })

  // load member
  const member = await store.get(Membership, { where: { id: memberId.toString() } })

  // ensure member exists
  if (!member) {
    return inconsistentState(`Non-existing member controller account update requested`, memberId)
  }

  // update member
  member.controllerAccount = newControllerAccount.toString()

  // set last update time
  member.updatedAt = new Date(event.blockTimestamp)

  // save member
  await store.save<Membership>(member)

  // emit log event
  logger.info("Member's controller has been updated", { ids: memberId })
}

/// ///////////////// Helpers ////////////////////////////////////////////////////

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
  logger.error('Not implemented entry method', { entryMethod: entryMethod.toString() })
  throw new Error('Not implemented entry method')
}

/*
  Returns true if event is emitted inside of `update_membership` extrinsic.
*/
function isUpdateMembershipExtrinsic(event: SubstrateEvent): boolean {
  if (!event.extrinsic) {
    // this should never happen
    return false
  }

  if (event.extrinsic.method === 'updateMembership') {
    return true
  }

  // no sudo was used to update membership -> this is not updateMembership
  if (event.extrinsic.section !== 'sudo') {
    return false
  }

  const sudoCallParameters = extractSudoCallParameters<unknown[]>(event)

  // very trivial check if update_membership extrinsic was used
  return sudoCallParameters.args.length === 4 // memberId, handle, avatarUri, about
}

interface IUnpackedUpdateMembershipOptions {
  memberId: MemberId
  handle: Bytes
  uri: Bytes
  text: Bytes
}

/*
  Returns unwrapped data + unite naming of uri/avatarUri and about/text
*/
function unpackUpdateMembershipOptions(args: Members.UpdateMembershipCall['args']): IUnpackedUpdateMembershipOptions {
  return {
    memberId: args.memberId,
    handle: args.handle.unwrapOrDefault(),
    uri: args.avatarUri.unwrapOrDefault(),
    text: args.about.unwrapOrDefault(),
  }
}
