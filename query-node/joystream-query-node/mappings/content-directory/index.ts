import * as BN from "bn.js";
import { assert } from "console";

import { DB, SubstrateEvent } from "../../generated/indexer";
import { decode } from "./decode";

import { Channel } from "../../generated/graphql-server/src/modules/channel/channel.model";
import { Member } from "../../generated/graphql-server/src/modules/member/member.model";

async function contentDirectory_EntitySchemaSupportAdded(db: DB, event: SubstrateEvent) {
	const _class = decode._getClassById(event);

	if (_class.name === "Channel") {
		const { id, accountId, properties } = decode._channelEntity(event);
		const owner = await db.get(Member, { where: { controllerAccount: accountId } });
		assert(owner, `Member not found: "${accountId}"`);
		const c = new Channel({
			id,
			owner,
			...properties,
		});
		await db.save<Channel>(c);
	}
}

export { contentDirectory_EntitySchemaSupportAdded };
