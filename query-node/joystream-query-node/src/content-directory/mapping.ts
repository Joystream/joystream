import { assert } from "console";

import { DB, SubstrateEvent } from "../../generated/indexer";
import { Channel } from "../../generated/graphql-server/src/modules/channel/channel.model";
import { Member } from "../../generated/graphql-server/src/modules/member/member.model";
import { ClassEntity } from "../../generated/graphql-server/src/modules/class-entity/class-entity.model";
import { Category } from "../../generated/graphql-server/src/modules/category/category.model";
import { KnownLicense } from "../../generated/graphql-server/src/modules/known-license/known-license.model";
import { UserDefinedLicense } from "../../generated/graphql-server/src/modules/user-defined-license/user-defined-license.model";
import { JoystreamMediaLocation } from "../../generated/graphql-server/src/modules/joystream-media-location/joystream-media-location.model";
import { HttpMediaLocation } from "../../generated/graphql-server/src/modules/http-media-location/http-media-location.model";
import { VideoMedia } from "../../generated/graphql-server/src/modules/video-media/video-media.model";
import { Video } from "../../generated/graphql-server/src/modules/video/video.model";

import { decode } from "./decode";
import { contentDirClasses, Classes } from "./constants";

async function contentDirectory_EntityRemoved(db: DB, event: SubstrateEvent) {
	const entity_id = decode.stringIfyEntityId(event);
	const classEntity = await db.get(ClassEntity, { where: { id: entity_id } });
   
	assert(classEntity, `Class not found for the EntityId: ${entity_id}`);
   
	const _class = contentDirClasses.find((c) => c.classId === classEntity.classId);
   
	if (_class.name === Classes.CHANNEL) {
	 await db.remove<Channel>({ id: entity_id });
	} else if (_class.name === Classes.CATEGORY) {
	 await db.remove<Category>({ id: entity_id });
	} else if (_class.name === Classes.KNOWNLICENSE) {
	 await db.remove<KnownLicense>({ id: entity_id });
	} else if (_class.name === Classes.USERDEFINEDLICENSE) {
	 await db.remove<UserDefinedLicense>({ id: entity_id });
	} else if (_class.name === Classes.JOYSTREAMMEDIALOCATION) {
	 await db.remove<JoystreamMediaLocation>({ id: entity_id });
	} else if (_class.name === Classes.HTTPMEDIALOCATION) {
	 await db.remove<HttpMediaLocation>({ id: entity_id });;
	} else if (_class.name === Classes.VIDEOMEDIA) {
	 await db.remove<VideoMedia>({ id: entity_id });
	} else if (_class.name === Classes.VIDEO) {
	 await db.remove<Video>({ id: entity_id });
	} else {
	 throw new Error(`Unknown class name: ${_class.name}`);
	}
   
	await db.remove<ClassEntity>({ id: entity_id });
}

async function contentDirectory_EntityCreated(db: DB, event: SubstrateEvent) {
	const classEntity = decode.getClassEntity(event);
	let class_entity = new ClassEntity ({ ...classEntity });
	await db.save<ClassEntity>(class_entity);
   }

async function contentDirectory_EntitySchemaSupportAdded(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const classEntity = await db.get(ClassEntity, { where: { id } });

	assert(classEntity, `Class not found for the EntityId: ${id}`);

	const _class = contentDirClasses.find((c) => c.classId === classEntity.classId);

	assert(_class, `Unknown ClassId: ${classEntity.classId}`);

	if (_class.name === Classes.CHANNEL) {
		await createChannel(db, event);
	} else if (_class.name === Classes.CATEGORY) {
		await createCategory(db, event);
	} else if (_class.name === Classes.KNOWNLICENSE) {
		await createKnownLicense(db, event);
	} else if (_class.name === Classes.USERDEFINEDLICENSE) {
		await createUserDefinedLicense(db, event);
	} else if (_class.name === Classes.JOYSTREAMMEDIALOCATION) {
		await createJoystreamMediaLocation(db, event);
	} else if (_class.name === Classes.HTTPMEDIALOCATION) {
		await createHttpMediaLocation(db, event);
	} else if (_class.name === Classes.VIDEOMEDIA) {
		await createVideoMedia(db, event);
	} else if (_class.name === Classes.VIDEO) {
		await createVideo(db, event);
	} else {
		throw new Error(`Unknown class name: ${_class.name}`);
	}
}

async function createChannel(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const { accountId, properties } = decode.channelEntity(event);
	const owner = await db.get(Member, { where: { controllerAccount: accountId } });

	assert(owner, `Member not found: "${accountId}"`);

	const channel = new Channel({
		id,
		owner,
		...properties,
	});
	await db.save(channel);
}

async function createCategory(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);

	const category = new Category({
		id,
		...decode.categoryEntity(event),
	});
	await db.save(category);
}

async function createKnownLicense(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const knownLicence = new KnownLicense({
		id,
		...decode.knownLicenseEntity(event),
	});
	await db.save(knownLicence);
}

async function createUserDefinedLicense(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const userDefinedLicense = new UserDefinedLicense({ id, ...decode.userDefinedLicenseEntity(event) });
	await db.save(userDefinedLicense);
}

async function createJoystreamMediaLocation(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const joyMediaLoc = new JoystreamMediaLocation({ id, ...decode.joystreamMediaLocationLicenseEntity(event) });
	await db.save(joyMediaLoc);
}

async function createHttpMediaLocation(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const hml = new HttpMediaLocation({ id, ...decode.httpMediaLocationEntity(event) });
	await db.save(hml);
}

async function createVideoMedia(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const videoMediaProperties = decode.videoMediaEntity(event);

	const joyMediaLoc = await db.get(JoystreamMediaLocation, {
		where: { id: videoMediaProperties.joystreamMediaLoc },
	});
	const httpMediaLoc = await db.get(HttpMediaLocation, { where: { id: videoMediaProperties.httpMediaLoc } });
	if (joyMediaLoc && httpMediaLoc) {
		throw new Error(
			`Video media can not reference more then one location(JoystreamMediaLocation, HttpMediaLocation)
				${JSON.stringify(joyMediaLoc)}
				${JSON.stringify(httpMediaLoc)}`
		);
	}
	const videoMedia = new VideoMedia({
		id,
		...decode.videoMediaEntity(event),
		httpMediaLocation: httpMediaLoc,
		joystreamMediaLocation: joyMediaLoc,
	});
	await db.save(videoMedia);
}

async function createVideo(db: DB, event: SubstrateEvent) {
	const id = decode.stringIfyEntityId(event);
	const videoEntityProperties = decode.videoEntity(event);

	const channel = await db.get(Channel, { where: { id: videoEntityProperties.channelId } });
	const category = await db.get(Category, { where: { id: videoEntityProperties.categoryId } });
	const videoMedia = await db.get(VideoMedia, { where: { id: videoEntityProperties.videoMediaId } });
	const userDefinedLicense = await db.get(UserDefinedLicense, {
		where: { id: videoEntityProperties.userDefinedLicenseId },
	});
	const knownLicense = await db.get(KnownLicense, { where: { id: videoEntityProperties.knownLicenceId } });

	if (userDefinedLicense && knownLicense) {
		throw new Error(
			`Video can not reference more then one license at the same time(UserDefinedLicense, KnownLicense)
				${JSON.stringify(userDefinedLicense)}
				${JSON.stringify(knownLicense)}`
		);
	}

	if (!userDefinedLicense && !knownLicense) {
		throw new Error(
			`Video license not found 'UserDefinedLincese': ${JSON.stringify(
				userDefinedLicense
			)} KnownLicense: ${JSON.stringify(knownLicense)}`
		);
	}
	const video = new Video({
		id,
		channel,
		category,
		videoMedia,
		userDefinedLicense,
		knownLicense,
		...decode.videoEntity(event),
	});
	await db.save(video);
}

export { contentDirectory_EntitySchemaSupportAdded, contentDirectory_EntityRemoved, contentDirectory_EntityCreated };
