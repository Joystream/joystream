import { IPropertyIdWithName } from '../types'

// Content directory predefined class names
export enum ContentDirectoryKnownClasses {
  CHANNEL = 'Channel',
  CATEGORY = 'Category',
  HTTPMEDIALOCATION = 'HttpMediaLocation',
  JOYSTREAMMEDIALOCATION = 'JoystreamMediaLocation',
  KNOWNLICENSE = 'KnownLicense',
  LANGUAGE = 'Language',
  LICENSE = 'License',
  MEDIALOCATION = 'MediaLocation',
  USERDEFINEDLICENSE = 'UserDefinedLicense',
  VIDEO = 'Video',
  VIDEOMEDIA = 'VideoMedia',
  VIDEOMEDIAENCODING = 'VideoMediaEncoding',
}

// Predefined content-directory classes, classId may change after the runtime seeding
export const contentDirectoryClassNamesWithId: { classId: number; name: string }[] = [
  { name: ContentDirectoryKnownClasses.CHANNEL, classId: 1 },
  { name: ContentDirectoryKnownClasses.CATEGORY, classId: 2 },
  { name: ContentDirectoryKnownClasses.HTTPMEDIALOCATION, classId: 3 },
  { name: ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION, classId: 4 },
  { name: ContentDirectoryKnownClasses.KNOWNLICENSE, classId: 5 },
  { name: ContentDirectoryKnownClasses.LANGUAGE, classId: 6 },
  { name: ContentDirectoryKnownClasses.LICENSE, classId: 7 },
  { name: ContentDirectoryKnownClasses.MEDIALOCATION, classId: 8 },
  { name: ContentDirectoryKnownClasses.USERDEFINEDLICENSE, classId: 9 },
  { name: ContentDirectoryKnownClasses.VIDEO, classId: 10 },
  { name: ContentDirectoryKnownClasses.VIDEOMEDIA, classId: 11 },
  { name: ContentDirectoryKnownClasses.VIDEOMEDIAENCODING, classId: 12 },
]

export const CategoryPropertyNamesWithId: IPropertyIdWithName = {
  0: 'name',
  1: 'description',
}

export const channelPropertyNamesWithId: IPropertyIdWithName = {
  0: 'title',
  1: 'description',
  2: 'coverPhotoUrl',
  3: 'avatarPhotoUrl',
  4: 'isPublic',
  5: 'isCurated',
  6: 'language',
}

export const licensePropertyNamesWithId: IPropertyIdWithName = {
  0: 'knownLicense',
  1: 'userDefinedLicense',
}

export const knownLicensePropertyNamesWIthId: IPropertyIdWithName = {
  0: 'code',
  1: 'name',
  2: 'description',
  3: 'url',
}

export const languagePropertyNamesWIthId: IPropertyIdWithName = {
  0: 'name',
  1: 'code',
}

export const userDefinedLicensePropertyNamesWithId: IPropertyIdWithName = {
  0: 'content',
}

export const mediaLocationPropertyNamesWithId: IPropertyIdWithName = {
  0: 'httpMediaLocation',
  1: 'joystreamMediaLocation',
}

export const joystreamMediaLocationPropertyNamesWithId: IPropertyIdWithName = {
  0: 'dataObjectId',
}

export const httpMediaLocationPropertyNamesWithId: IPropertyIdWithName = {
  0: 'url',
  1: 'port',
}

export const videoMediaEncodingPropertyNamesWithId: IPropertyIdWithName = {
  0: 'name',
}

export const videoMediaPropertyNamesWithId: IPropertyIdWithName = {
  0: 'encoding',
  1: 'pixelWidth',
  2: 'pixelHeight',
  3: 'size',
  4: 'location',
}

export const videoPropertyNamesWithId: IPropertyIdWithName = {
  // referenced entity's id
  0: 'channel',
  // referenced entity's id
  1: 'category',
  2: 'title',
  3: 'description',
  4: 'duration',
  5: 'skippableIntroDuration',
  6: 'thumbnailURL',
  7: 'language',
  // referenced entity's id
  8: 'media',
  9: 'hasMarketing',
  10: 'publishedBeforeJoystream',
  11: 'isPublic',
  12: 'isExplicit',
  13: 'license',
  14: 'isCurated',
}
