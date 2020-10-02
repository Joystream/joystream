import * as assert from "assert";

import { Member } from "../../generated/graphql-server/src/modules/member/member.model";
import { DB, SubstrateEvent } from "../../generated/indexer";
import { decode } from "./decode";

async function members_MemberRegistered(db: DB, event: SubstrateEvent) {
	const joystreamMember = decode._members_MemberRegistered(event);
	let member = new Member({ ...joystreamMember });
	await db.save<Member>(member);
}

async function members_MemberUpdatedAboutText(db: DB, event: SubstrateEvent) {
	const { memberId, about } = decode._members_MemberUpdatedAboutText(event);
	const member = await db.get(Member, { where: { memberId } });
	assert(member, "Member not found");

	member.about = about;
	await db.save<Member>(member);
}

async function members_MemberUpdatedAvatar(db: DB, event: SubstrateEvent) {
	const { memberId, avatarUri } = decode._members_MemberUpdatedAvatar(event);
	const member = await db.get(Member, { where: { memberId } });
	assert(member, "Member not found");

	member.avatarUri = avatarUri;
	await db.save<Member>(member);
}

async function members_MemberUpdatedHandle(db: DB, event: SubstrateEvent) {
	const { memberId, handle } = decode._members_MemberUpdatedHandle(event);
	const member = await db.get(Member, { where: { memberId } });
	assert(member, "Member not found");

	member.handle = handle;
	await db.save<Member>(member);
}

async function members_MemberSetRootAccount(db: DB, event: SubstrateEvent) {
	const { memberId, rootAccount } = decode._members_MemberSetRootAccount(event);
	const member = await db.get(Member, { where: { memberId } });
	assert(member, "Member not found");

	member.rootAccount = rootAccount;
	await db.save<Member>(member);
}

async function members_MemberSetControllerAccount(db: DB, event: SubstrateEvent) {
	const { memberId, controllerAccount } = decode._members_MemberSetControllerAccount(event);
	const member = await db.get(Member, { where: { memberId } });
	assert(member, "Member not found");

	member.controllerAccount = controllerAccount;
	await db.save<Member>(member);
}

export {
	members_MemberRegistered,
	members_MemberUpdatedAboutText,
	members_MemberUpdatedAvatar,
	members_MemberUpdatedHandle,
	members_MemberSetRootAccount,
	members_MemberSetControllerAccount,
};
