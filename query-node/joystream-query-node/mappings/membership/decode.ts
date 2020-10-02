/**
 * This module contains pre-mappings for membership mappings to decode event/extrinsic data
 *
 */

import * as BN from "bn.js";
import Debug from "debug";

import {
	JoystreamMember,
	MemberAboutText,
	MemberAvatarURI,
	MemberControllerAccount,
	MemberHandle,
	MemberRootAccount,
} from "../types";
import { SubstrateEvent } from "../../generated/indexer";

const debug = Debug("mappings:prehandler");

function _members_MemberRegistered(event: SubstrateEvent): JoystreamMember {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: memberId, 1: accountId } = event.params;
	const { 1: handle, 2: avatarUri, 3: about } = event.extrinsic.args;
	return {
		registeredAtBlock: event.blockNumber,
		memberId: new BN(memberId.value as string),
		rootAccount: Buffer.from(accountId.value as string),
		controllerAccount: Buffer.from(accountId.value as string),
		handle: handle.value as string,
		avatarUri: avatarUri.value as string,
		about: about.value as string,
	};
}

function _members_MemberUpdatedAboutText(event: SubstrateEvent): MemberAboutText {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: memberId } = event.params;
	const { 1: about } = event.extrinsic.args;
	return { memberId: new BN(memberId.value as string), about: about.value as string };
}

function _members_MemberUpdatedAvatar(event: SubstrateEvent): MemberAvatarURI {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: memberId } = event.params;
	const { 1: avatarUri } = event.extrinsic.args;
	return { memberId: new BN(memberId.value as string), avatarUri: avatarUri.value as string };
}

function _members_MemberUpdatedHandle(event: SubstrateEvent): MemberHandle {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: memberId } = event.params;
	const { 1: handle } = event.extrinsic.args;
	return { memberId: new BN(memberId.value as string), handle: handle.value as string };
}

function _members_MemberSetRootAccount(event: SubstrateEvent): MemberRootAccount {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: memberId, 1: rootAccount } = event.params;
	return { memberId: new BN(memberId.value as string), rootAccount: Buffer.from(rootAccount.value as string) };
}

function _members_MemberSetControllerAccount(event: SubstrateEvent): MemberControllerAccount {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: memberId, 1: controllerAccount } = event.params;
	return {
		memberId: new BN(memberId.value as string),
		controllerAccount: Buffer.from(controllerAccount.value as string),
	};
}

export const decode = {
	_members_MemberRegistered,
	_members_MemberUpdatedAboutText,
	_members_MemberUpdatedAvatar,
	_members_MemberUpdatedHandle,
	_members_MemberSetRootAccount,
	_members_MemberSetControllerAccount,
};
