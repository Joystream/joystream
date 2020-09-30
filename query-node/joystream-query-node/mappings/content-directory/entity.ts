import * as BN from "bn.js";
import { assert } from "console";

import { DB, SubstrateEvent } from "../../generated/indexer";
import { Class } from "../../generated/graphql-server/src/modules/class/class.model";
import { Entity } from "../../generated/graphql-server/src/modules/entity/entity.model";
import { EntityController } from "../../generated/graphql-server/src/modules/entity-controller/entity-controller.model";

async function contentDirectory_EntityCreated(db: DB, event: SubstrateEvent) {
	const { params, extrinsic } = event;

	assert(extrinsic, "No extrinsic data found!");

	const { 0: classId, 1: actor } = extrinsic.args;
	const c = await db.get(Class, { where: { classId: new BN(classId.value.toString()) } });

	// TODO: not sure how to parse `actor` value
	const entityController = await db.get(EntityController, { where: { controllerType: actor.value.toString() } });

	const entity = new Entity({
		class: c,
		entityId: new BN(params[0].value.toString()),
		controller: entityController,
		totalNumberOfInboundReferences: new BN(0), // default
		sameOwnerInboundReferences: new BN(0), // default,
		isFrozen: false, // default
		isReferenceable: true, // default
	});

	await db.save<Entity>(entity);
}

export { contentDirectory_EntityCreated };
