import { IPropertyIdWithName } from '../types'

// Content directory predefined class names
export enum ContentDirectoryKnownClasses {
  CHANNEL = 'Channel',
  CATEGORY = 'Category',
  KNOWNLICENSE = 'KnownLicense',
  USERDEFINEDLICENSE = 'UserDefinedLicense',
  JOYSTREAMMEDIALOCATION = 'JoystreamMediaLocation',
  HTTPMEDIALOCATION = 'HttpMediaLocation',
  VIDEOMEDIA = 'VideoMedia',
  VIDEO = 'Video',
  LANGUAGE = 'Language',
  VIDEOMEDIAENCODING = 'VideoMediaEncoding',
}

// Predefined content-directory classes, classId may change after the runtime seeding
export const contentDirectoryClassNamesWithId: { classId: number; name: string }[] = [
  { name: ContentDirectoryKnownClasses.CHANNEL, classId: 1 },
  { name: ContentDirectoryKnownClasses.CATEGORY, classId: 2 },
  { name: ContentDirectoryKnownClasses.KNOWNLICENSE, classId: 6 },
  { name: ContentDirectoryKnownClasses.USERDEFINEDLICENSE, classId: 0 },
  { name: ContentDirectoryKnownClasses.LANGUAGE, classId: 7 },
  { name: ContentDirectoryKnownClasses.JOYSTREAMMEDIALOCATION, classId: 5 },
  { name: ContentDirectoryKnownClasses.HTTPMEDIALOCATION, classId: 4 },
  { name: ContentDirectoryKnownClasses.VIDEOMEDIA, classId: 12 },
  { name: ContentDirectoryKnownClasses.VIDEO, classId: 11 },
  { name: ContentDirectoryKnownClasses.VIDEOMEDIAENCODING, classId: 13 },
]

export const CategoryPropertyNamesWithId: IPropertyIdWithName = {
  0: 'name',
  1: 'description',
}

export const channelPropertyNamesWithId: IPropertyIdWithName = {
  0: 'title',
  1: 'description',
  2: 'coverPhotoURL',
  3: 'avatarPhotoURL',
  4: 'isPublic',
  5: 'isCurated',
  6: 'language',
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
