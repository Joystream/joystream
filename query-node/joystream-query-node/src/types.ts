import * as BN from "bn.js";

export interface BaseJoystreamMember {
	memberId: BN;
}

export interface IClassEntity {
	id: string,
	classId: BN
}

export interface JoystreamMember extends BaseJoystreamMember {
	handle: string;
	avatarUri: string;
	about: string;
	registeredAtBlock: number;
	rootAccount: Buffer;
	controllerAccount: Buffer;
}

export interface MemberAboutText extends BaseJoystreamMember {
	about: string;
}

export interface MemberAvatarURI extends BaseJoystreamMember {
	avatarUri: string;
}

export interface MemberHandle extends BaseJoystreamMember {
	handle: string;
}

export interface MemberRootAccount extends BaseJoystreamMember {
	rootAccount: Buffer;
}
export interface MemberControllerAccount extends BaseJoystreamMember {
	controllerAccount: Buffer;
}

export enum Language {
	CHINESE = "CHINESE",
	ENGLISH = "ENGLISH",
	ARABIC = "ARABIC",
	PORTUGESE = "PORTUGESE",
	FRENCH = "FRENCH",
}

interface Version {
	version: number;
}

export interface IChannelProperties extends Version {
	title: string;
	description: string;
	coverPhotoURL: string;
	avatarPhotoURL: string;
	isPublic: boolean;
	isCurated: boolean;
	language: Language;
}

export interface IChannel {
	accountId: Buffer;
	properties: IChannelProperties;
}

export interface ICategory extends Version {
	name: string;
	description: string;
}

export interface IKnownLicense {
	code: string;
	name?: string;
	description?: string;
	url?: string;
}

export interface IUserDefinedLicense {
	content: string;
}

export interface IJoystreamMediaLocation {
	dataObjectId: string;
}

export interface IHttpMediaLocation {
	url: string;
	port?: number;
}

export enum VideoMediaEncoding {
	H264_MPEG4 = "H264_MPEG4",
	VP8_WEBM = "VP8_WEBM",
	THEROA_VORBIS = "THEROA_VORBIS",
}

export interface IVideoMedia {
	encoding: VideoMediaEncoding;
	pixelWidth: number;
	pixelHeight: number;
	size: BN;
	// referenced entity's id
	httpMediaLoc?: number;
	// referenced entity's id
	joystreamMediaLoc?: number;
}

export interface IVideo {
	// referenced entity's id
	channelId: number;
	// referenced entity's id
	categoryId: number;
	title: string;
	description: string;
	duration: number;
	skippableIntroDuration?: BN;
	thumbnailURL: string;
	language: Language;
	// referenced entity's id
	videoMediaId: number;
	hasMarketing?: boolean;
	publishedBeforeJoystream?: BN;
	isPublic: boolean;
	isCurated: boolean;
	isExplicit: boolean;
	// referenced entity's id
	knownLicenceId?: number;
	// referenced entity's id
	userDefinedLicenseId?: number;
}
