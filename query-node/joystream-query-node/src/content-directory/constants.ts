// Content directory predefined class names
export enum Classes {
	CHANNEL = "Channel",
	CATEGORY = "Category",
	KNOWNLICENSE = "KnownLicense",
	USERDEFINEDLICENSE = "UserDefinedLicense",
	JOYSTREAMMEDIALOCATION = "JoystreamMediaLocation",
	HTTPMEDIALOCATION = "HttpMediaLocation",
	VIDEOMEDIA = "VideoMedia",
	VIDEO = "Video",
}

// Predefined content-directory classes, classId may change after the runtime seeding
export const contentDirClasses: { classId: number; name: string }[] = [
	{ name: Classes.CHANNEL, classId: 0 },
	{ name: Classes.CATEGORY, classId: 1 },
	{ name: Classes.KNOWNLICENSE, classId: 2 },
	{ name: Classes.USERDEFINEDLICENSE, classId: 3 },
	{ name: Classes.JOYSTREAMMEDIALOCATION, classId: 4 },
	{ name: Classes.HTTPMEDIALOCATION, classId: 5 },
	{ name: Classes.VIDEOMEDIA, classId: 6 },
	{ name: Classes.VIDEO, classId: 7 },
];
