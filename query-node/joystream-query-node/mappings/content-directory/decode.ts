import Debug from "debug";

import { SubstrateEvent } from "../../generated/indexer";
import { IChannel, IChannelProperties, IContentDirectoryClass } from "../types";
import { contentDirClasses } from "./constants";

const debug = Debug("mappings:content-directory");

function _getClassById(event: SubstrateEvent): IContentDirectoryClass {
	const { 0: classId } = event.extrinsic.args;
	const c = contentDirClasses.find((c) => c.classId === (classId.value as number));

	if (!c) throw new Error(`Class not found: "${classId.value as number}"`);
	return c;
}

function _channelEntity(event: SubstrateEvent): IChannel {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: actor, 1: entityId, 3: newPropertyValues } = event.extrinsic.args;
	const properties = (newPropertyValues.value as unknown) as IChannelProperties;
	return {
		id: entityId.value as string,
		accountId: Buffer.from(actor.value as string),
		properties,
	};
}

export const decode = { _getClassById, _channelEntity };
