import { thumbnailSources } from './mockImages'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import rawVideos from './raw/videos.json'

export type MockVideo = Omit<VideoFields, 'media' | 'category' | 'channel' | 'createdAt' | 'duration'> & {
  createdAt: unknown
}

const mockVideos: MockVideo[] = rawVideos.map((rawVideo, idx) => {
  return {
    ...rawVideo,
    __typename: 'Video',
    thumbnailUrl: thumbnailSources[idx % thumbnailSources.length],
  }
})

export default mockVideos
