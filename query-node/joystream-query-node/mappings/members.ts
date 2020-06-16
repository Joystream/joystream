import * as assert from 'assert';
import { CheckedUserInfo } from '@joystream/types/lib/members';

import { Member } from '../generated/graphql-server/src/modules/member/member.model';
import { DB, SubstrateEvent } from '../generated/indexer';

export async function handleMemberRegistered(db: DB, event: SubstrateEvent) {
  const { AccountId, MemberId } = event.event_params;

  // Not safe type casting!
  const userInfo = (event.extrinsic?.args[1].toJSON() as unknown) as CheckedUserInfo;

  let member = new Member();
  member.registeredAtBlock = event.block_number.toString();
  member.memberId = MemberId.toString();
  member.rootAccount = Buffer.from(AccountId);
  member.controllerAccount = Buffer.from(AccountId);
  member.handle = userInfo.handle.toString();
  member.avatarUri = userInfo.avatar_uri.toString();
  member.about = userInfo.about.toString();

  db.save<Member>(member);
}

export async function handleMemberUpdatedAboutText(db: DB, event: SubstrateEvent) {
  const { MemberId } = event.event_params;
  const member = await db.get(Member, { where: { memberId: MemberId.toString() } });

  assert(member);

  // Not safe type casting!
  const userInfo = (event.extrinsic?.args[1].toJSON() as unknown) as CheckedUserInfo;
  member.about = userInfo.about.toString();

  db.save<Member>(member);
}

export async function handleMemberUpdatedAvatar(db: DB, event: SubstrateEvent) {
  const { MemberId } = event.event_params;
  const member = await db.get(Member, { where: { memberId: MemberId.toString() } });

  assert(member);

  // Not safe type casting!
  const userInfo = (event.extrinsic?.args[1].toJSON() as unknown) as CheckedUserInfo;
  member.avatarUri = userInfo.avatar_uri.toString();

  db.save<Member>(member);
}

export async function handleMemberUpdatedHandle(db: DB, event: SubstrateEvent) {
  const { MemberId } = event.event_params;
  const member = await db.get(Member, { where: { memberId: MemberId.toString() } });

  assert(member);

  // Not safe type casting!
  const userInfo = (event.extrinsic?.args[1].toJSON() as unknown) as CheckedUserInfo;
  member.handle = userInfo.handle.toString();

  db.save<Member>(member);
}

export async function handleMemberSetRootAccount(db: DB, event: SubstrateEvent) {
  const { MemberId, AccountId } = event.event_params;
  const member = await db.get(Member, { where: { memberId: MemberId.toString() } });

  assert(member);

  member.rootAccount = Buffer.from(AccountId);
  db.save<Member>(member);
}

export async function handleMemberSetControllerAccount(db: DB, event: SubstrateEvent) {
  const { MemberId, AccountId } = event.event_params;
  const member = await db.get(Member, { where: { memberId: MemberId.toString() } });

  assert(member);

  member.controllerAccount = Buffer.from(AccountId);
  db.save<Member>(member);
}

// MemberRegisteredRole(MemberId, ActorInRole<ActorId>),
// MemberUnregisteredRole(MemberId, ActorInRole<ActorId>),
