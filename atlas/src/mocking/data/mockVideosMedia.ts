import { VideoMediaFields, VideoMediaFields_location } from '@/api/queries/__generated__/VideoMediaFields'
import rawVideosMedia from './raw/videosMedia.json'

export type MockVideoMedia = VideoMediaFields & {
  duration: number
  coverCutLocation?: VideoMediaFields_location
}

const mockVideosMedia: MockVideoMedia[] = rawVideosMedia.map((rawVideoMedia) => {
  return {
    ...rawVideoMedia,
    __typename: 'VideoMedia',
    location: {
      __typename: 'HTTPVideoMediaLocation',
      ...rawVideoMedia.location,
    },
  }
})

export default mockVideosMedia
