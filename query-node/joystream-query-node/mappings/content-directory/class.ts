import { assert } from "console";
import * as BN from "bn.js";
import { In } from "typeorm";

import { bool } from "@polkadot/types/primitive";

import { DB, SubstrateEvent } from "../../generated/indexer";
import { Class } from "../../generated/graphql-server/src/modules/class/class.model";
import { CuratorGroup } from "../../generated/graphql-server/src/modules/curator-group/curator-group.model";

// TODO: Remove this defination when @joystream/types has ClassPermissions type
interface ClassPermissions {
	any_member: bool;
	entity_creation_blocked: bool;
	all_entity_property_values_locked: bool;
	maintainers: number[];
}

async function contentDirectory_ClassCreated(db: DB, event: SubstrateEvent) {
	const { params, extrinsic } = event;

	assert(extrinsic, "No extrinsic data found");

	// TODO: Replace `ClassPermissions` with @joystream/types/...
	const classPermissions = (extrinsic.args[2].value as unknown) as ClassPermissions;
	const maintainers = await db.getMany(CuratorGroup, { where: { groupId: In(classPermissions.maintainers) } });

	const c = new Class({
		classId: new BN(params[0].value.toString()),
		name: extrinsic.args[0].value.toString(),
		description: extrinsic.args[1].value.toString(),
		anyMemberCanCreate: classPermissions.any_member,
		entityCreationBlocked: classPermissions.entity_creation_blocked,
		allEntityPropertyValuesLocked: classPermissions.all_entity_property_values_locked,
		maintainers: maintainers,
	});

	await db.save<Class>(c);
}

export { contentDirectory_ClassCreated };
