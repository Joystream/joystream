import rawCoverVideo from './raw/coverVideo.json'
import { MockVideo } from '@/mocking/data/mockVideos'
import { MockVideoMedia } from '@/mocking/data/mockVideosMedia'
import { MockChannel } from '@/mocking/data/mockChannels'

export const mockCoverVideoChannel: MockChannel = {
  ...rawCoverVideo.channel,
  __typename: 'Channel',
}

export const mockCoverVideo: MockVideo = {
  ...rawCoverVideo.video,
  __typename: 'Video',
}

export const mockCoverVideoMedia: MockVideoMedia = {
  ...rawCoverVideo.videoMedia,
  __typename: 'VideoMedia',
  location: {
    __typename: 'HTTPVideoMediaLocation',
    ...rawCoverVideo.videoMedia.location,
  },
}
