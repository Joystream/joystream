import Debug from "debug";
import * as BN from "bn.js";

import { SubstrateEvent } from "../../generated/indexer";
import { ClassEntity } from "../../generated/graphql-server/src/modules/class-entity/class-entity.model";
import { IChannel, IChannelProperties, IContentDirectoryClass } from "../types";
import { contentDirClasses } from "./constants";

const debug = Debug("mappings:content-directory");

function _getClassEntity(event: SubstrateEvent): ClassEntity {
	const { 0: classId } = event.extrinsic.args;
	const { 1: entityId } = event.event_params;
	return new ClassEntity({
		id: entityId.toString(),
		classId: (classId.value as unknown) as BN,
	});
}

function _getClassById(classId: BN): IContentDirectoryClass {
	const c = contentDirClasses.find((c) => c.classId === (classId as unknown) as number);
	if (!c) throw new Error(`Class not found: "${(classId as unknown) as number}"`);
	return c;
}

// Get entity id for from entity related substrate event.
function _getEntityId(event: SubstrateEvent): string {
	const { 1: entityId } = event.extrinsic.args;
	return entityId.toString();
}

function _channelEntity(event: SubstrateEvent): IChannel {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 1: entityId, 3: newPropertyValues } = event.extrinsic.args;
	const properties = (newPropertyValues.value as unknown) as IChannelProperties;
	return {
		id: entityId.value as string,
		properties,
	};
}

export const decode = { _getClassEntity, _getEntityId, _getClassById, _channelEntity };
