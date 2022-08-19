// basic templates for content entities

import { v4 as uuid } from 'uuid'

export function getMemberDefaults(index: number) {
  return {
    // member needs unique name due to CLI requirement for that
    name: 'TestingActiveVideoCounters-' + uuid().substring(0, 8),
  }
}

export function getVideoDefaults(index: number, cliExamplesFolderPath: string) {
  return {
    title: 'Active video counters Testing video',
    description: 'Video for testing active video counters.',
    videoPath: cliExamplesFolderPath + '/video.mp4',
    thumbnailPhotoPath: cliExamplesFolderPath + '/avatar-photo-1.png',
    language: 'en',
    hasMarketing: false,
    isPublic: true,
    isExplicit: false,
    // category: 1, - no category set by default
    license: {
      code: 1001,
      attribution: 'by Joystream Contributors',
    },
    enableComments: true,
  }
}

export function getVideoCategoryDefaults(index: number) {
  return {
    name: 'Active video counters Testing video category',
  }
}

export function getChannelDefaults(index: number, cliExamplesFolderPath: string) {
  return {
    title: 'Active video counters Testing channel',
    description: 'Channel for testing active video counters.',
    avatarPhotoPath: cliExamplesFolderPath + '/avatar-photo-1.png',
    coverPhotoPath: cliExamplesFolderPath + '/cover-photo-1.png',
    isPublic: true,
    language: 'en',
  }
}

export function getChannelCategoryDefaults(index: number) {
  return {}
}
