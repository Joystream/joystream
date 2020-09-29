import * as assert from "assert";
import * as BN from "bn.js";

import { Member } from "../../generated/graphql-server/src/modules/member/member.model";
import { DB, SubstrateEvent } from "../../generated/indexer";

import { getMemberById } from "./helper";

async function members_MemberRegistered(db: DB, event: SubstrateEvent) {
	const { 0: memberId, 1: accountId } = event.params;

	assert(event.extrinsic, "No extrinsic data found");

	const extrinsicArgs = event.extrinsic.args;

	let member = new Member({
		registeredAtBlock: event.blockNumber,
		memberId: new BN(memberId.value.toString()),
		rootAccount: Buffer.from(accountId.value.toString()),
		controllerAccount: Buffer.from(accountId.value.toString()),
		handle: extrinsicArgs[1].value.toString(),
		avatarUri: extrinsicArgs[2].value.toString(),
		about: extrinsicArgs[3].value.toString(),
	});

	db.save<Member>(member);
}

async function members_MemberUpdatedAboutText(db: DB, event: SubstrateEvent) {
	const member = await getMemberById(db, event.params[0].value.toString());
	// const member = await db.get(Member, { where: { memberId: new BN(event.params[0].value.toString()) } });

	assert(member);
	assert(event.extrinsic, "No extrinsic data found");

	member.about = event.extrinsic?.args[1].value.toString();
	db.save<Member>(member);
}

async function members_MemberUpdatedAvatar(db: DB, event: SubstrateEvent) {
	const member = await getMemberById(db, event.params[0].value.toString());

	assert(member);
	assert(event.extrinsic, "No extrinsic data found");

	member.avatarUri = event.extrinsic?.args[1].value.toString();
	db.save<Member>(member);
}

async function members_MemberUpdatedHandle(db: DB, event: SubstrateEvent) {
	const member = await getMemberById(db, event.params[0].value.toString());

	assert(member);
	assert(event.extrinsic, "No extrinsic data found");

	member.handle = event.extrinsic?.args[1].value.toString();
	db.save<Member>(member);
}

async function members_MemberSetRootAccount(db: DB, event: SubstrateEvent) {
	const { 0: memberId, 1: newRootAccountId } = event.params;
	const member = await getMemberById(db, memberId.value.toString());

	assert(member);
	assert(event.extrinsic, "No extrinsic data found");

	member.rootAccount = Buffer.from(newRootAccountId.value.toString());
	db.save<Member>(member);
}

async function members_MemberSetControllerAccount(db: DB, event: SubstrateEvent) {
	const { 0: memberId, 1: newControllerAccount } = event.params;
	const member = await getMemberById(db, memberId.value.toString());

	assert(member);
	assert(event.extrinsic, "No extrinsic data found");

	member.controllerAccount = Buffer.from(newControllerAccount.value.toString());
	db.save<Member>(member);
}

export {
	members_MemberRegistered,
	members_MemberUpdatedAboutText,
	members_MemberUpdatedAvatar,
	members_MemberUpdatedHandle,
	members_MemberSetRootAccount,
	members_MemberSetControllerAccount,
};
