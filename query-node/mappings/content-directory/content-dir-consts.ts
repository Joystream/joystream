import { IKnownClass, IPropertyWithId } from '../types'

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
  FEATUREDVIDEOS = 'FeaturedVideo',
}

// Predefined content-directory classes, classId may change after the runtime seeding
export const contentDirectoryClassNamesWithId: IKnownClass[] = [
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
  { name: ContentDirectoryKnownClasses.FEATUREDVIDEOS, classId: 13 },
]

export const categoryPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'name', type: 'string', required: true },
  1: { name: 'description', type: 'string', required: false },
}

export const channelPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'handle', type: 'string', required: true },
  1: { name: 'description', type: 'string', required: false },
  2: { name: 'coverPhotoUrl', type: 'string', required: false },
  3: { name: 'avatarPhotoUrl', type: 'string', required: false },
  4: { name: 'isPublic', type: 'boolean', required: true },
  5: { name: 'isCurated', type: 'boolean', required: false },
  6: { name: 'language', type: 'number', required: false },
}

export const licensePropertyNamesWithId: IPropertyWithId = {
  0: { name: 'knownLicense', type: 'number', required: false },
  1: { name: 'userDefinedLicense', type: 'number', required: false },
  2: { name: 'attribution', type: 'string', required: false },
}

export const knownLicensePropertyNamesWIthId: IPropertyWithId = {
  0: { name: 'code', type: 'string', required: true },
  1: { name: 'name', type: 'string', required: false },
  2: { name: 'description', type: 'string', required: false },
  3: { name: 'url', type: 'string', required: false },
}

export const languagePropertyNamesWIthId: IPropertyWithId = {
  0: { name: 'name', type: 'string', required: true },
  1: { name: 'code', type: 'string', required: true },
}

export const userDefinedLicensePropertyNamesWithId: IPropertyWithId = {
  0: { name: 'content', type: 'string', required: false },
}

export const mediaLocationPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'httpMediaLocation', type: 'number', required: false },
  1: { name: 'joystreamMediaLocation', type: 'number', required: false },
}

export const joystreamMediaLocationPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'dataObjectId', type: 'string', required: true },
}

export const httpMediaLocationPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'url', type: 'string', required: false },
  1: { name: 'port', type: 'number', required: false },
}

export const videoMediaEncodingPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'name', type: 'string', required: true },
}

export const videoMediaPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'encoding', type: 'number', required: true },
  1: { name: 'pixelWidth', type: 'number', required: true },
  2: { name: 'pixelHeight', type: 'number', required: true },
  3: { name: 'size', type: 'number', required: false },
  4: { name: 'location', type: 'number', required: true },
}

export const videoPropertyNamesWithId: IPropertyWithId = {
  // referenced entity's id
  0: { name: 'channel', type: 'number', required: true },
  // referenced entity's id
  1: { name: 'category', type: 'number', required: true },
  2: { name: 'title', type: 'string', required: false },
  3: { name: 'description', type: 'string', required: false },
  4: { name: 'duration', type: 'number', required: true },
  5: { name: 'skippableIntroDuration', type: 'number', required: false },
  6: { name: 'thumbnailUrl', type: 'string', required: true },
  7: { name: 'language', type: 'number', required: false },
  // referenced entity's id
  8: { name: 'media', type: 'number', required: true },
  9: { name: 'hasMarketing', type: 'boolean', required: false },
  10: { name: 'publishedBeforeJoystream', type: 'number', required: false },
  11: { name: 'isPublic', type: 'boolean', required: true },
  12: { name: 'isExplicit', type: 'boolean', required: true },
  13: { name: 'license', type: 'number', required: true },
  14: { name: 'isCurated', type: 'boolean', required: true },
}

export const featuredVideoPropertyNamesWithId: IPropertyWithId = {
  0: { name: 'video', type: 'number', required: true },
}
