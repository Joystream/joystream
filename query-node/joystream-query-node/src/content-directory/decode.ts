import Debug from "debug";
import * as BN from "bn.js";

import { SubstrateEvent } from "../../generated/indexer";
import {
	IChannel,
	IClassEntity,
	IChannelProperties,
	ICategory,
	IKnownLicense,
	IUserDefinedLicense,
	IJoystreamMediaLocation,
	IHttpMediaLocation,
	IVideoMedia,
	IVideo,
} from "../types";

const debug = Debug("mappings:content-directory");

function stringIfyEntityId(event: SubstrateEvent): string {
	const { 1: entityId } = event.params;
	return entityId.value as string;
}

function channelEntity(event: SubstrateEvent): IChannel {
	debug(`Substrate event: ${JSON.stringify(event)}`);

	const { 0: actor, 3: newPropertyValues } = event.extrinsic.args;
	const properties = (newPropertyValues.value as unknown) as IChannelProperties;
	return {
		accountId: Buffer.from(actor.value as string),
		properties,
	};
}

function getClassEntity(event: SubstrateEvent): IClassEntity {
	const { 0: classId } = event.extrinsic.args;
	const { 1: entityId } = event.params;
	return  {
	 id: (entityId.value as unknown) as string,
	 classId: (classId.value as unknown) as BN,
	};
}

function categoryEntity(event: SubstrateEvent): ICategory {
	debug(`Substrate event: ${JSON.stringify(event)}`);
	return (event.extrinsic.args[3].value as unknown) as ICategory;
}

function knownLicenseEntity(event: SubstrateEvent): IKnownLicense {
	return (event.extrinsic.args[3].value as unknown) as IKnownLicense;
}

function userDefinedLicenseEntity(event: SubstrateEvent): IUserDefinedLicense {
	return (event.extrinsic.args[3].value as unknown) as IUserDefinedLicense;
}

function joystreamMediaLocationLicenseEntity(event: SubstrateEvent): IJoystreamMediaLocation {
	return (event.extrinsic.args[3].value as unknown) as IJoystreamMediaLocation;
}

function httpMediaLocationEntity(event: SubstrateEvent): IHttpMediaLocation {
	return (event.extrinsic.args[3].value as unknown) as IHttpMediaLocation;
}

function videoMediaEntity(event: SubstrateEvent): IVideoMedia {
	return (event.extrinsic.args[3].value as unknown) as IVideoMedia;
}

function videoEntity(event: SubstrateEvent): IVideo {
	return (event.extrinsic.args[3].value as unknown) as IVideo;
}

export const decode = {
	stringIfyEntityId,
	channelEntity,
	categoryEntity,
	knownLicenseEntity,
	userDefinedLicenseEntity,
	joystreamMediaLocationLicenseEntity,
	httpMediaLocationEntity,
	videoMediaEntity,
	videoEntity,
	getClassEntity
};
