import { thumbnailSources } from './mockImages'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import rawVideos from './raw/videos.json'

type MockVideo = Omit<VideoFields, 'media' | 'category' | 'channel' | 'publishedOnJoystreamAt' | 'duration'> & {
  publishedOnJoystreamAt: unknown
}

const mockVideos: MockVideo[] = rawVideos.map((rawVideo, idx) => {
  return {
    ...rawVideo,
    __typename: 'Video',
    thumbnailURL: thumbnailSources[idx % thumbnailSources.length],
  }
})

export default mockVideos
