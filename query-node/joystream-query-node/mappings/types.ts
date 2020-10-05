import * as BN from "bn.js";

export interface BaseJoystreamMember {
	memberId: BN;
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

export interface IChannelProperties {
	title: string;
	description: string;
	coverPhotoURL: string;
	avatarPhotoURL: string;
	isPublic: boolean;
	isCurated: boolean;
	language: Language;
}

export interface IChannel {
	id: string;
	accountId: Buffer;
	properties: IChannelProperties;
}

export type ClassName =
	| "Channel"
	| "Category"
	| "KnownLicense"
	| "UserDefinedLicense"
	| "JoystreamMediaLocation"
	| "HttpMediaLocation"
	| "VideoMedia"
	| "Video";

export interface IContentDirectoryClass {
	classId: number;
	name: ClassName;
}
