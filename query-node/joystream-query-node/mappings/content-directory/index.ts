import * as BN from "bn.js";
import { assert } from "console";

import { DB, SubstrateEvent } from "../../generated/indexer";
import { decode } from "./decode";

import { Channel } from "../../generated/graphql-server/src/modules/channel/channel.model";
import { ClassEntity } from "../../generated/graphql-server/src/modules/class-entity/class-entity.model";

async function contentDirectory_EntityCreated(db: DB, event: SubstrateEvent) {
	const classEntity = decode._getClassEntity(event);
	let class_entity = new ClassEntity ({ ...classEntity });
	await db.save<ClassEntity>(class_entity);
}

async function contentDirectory_EntityRemoved(db: DB, event: SubstrateEvent) {
	const entity_id = decode._getEntityId(event);
	await db.remove<ClassEntity>({ id: entity_id });
}

async function contentDirectory_EntitySchemaSupportAdded(db: DB, event: SubstrateEvent) {
	const entity_id = decode._getEntityId(event);
	const class_entity = await db.get(ClassEntity, { where: { id: entity_id } });

	assert(class_entity, 'Class -> Entity relation not found! Invalid entity_id');

	const _class = decode._getClassById(class_entity.classId);

	if (_class.name === "Channel") {
		const { id, properties } = decode._channelEntity(event);
		const c = new Channel({
			id,
			...properties,
		});
		await db.save<Channel>(c);
	}
}

export { contentDirectory_EntitySchemaSupportAdded };
