import React, { useCallback, useState } from 'react'
import styled from '@emotion/styled'
import { InfiniteVideoGrid } from '../components'
import { withKnobs } from '@storybook/addon-knobs'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'

export default {
  title: 'InfiniteVideoGrid',
  component: InfiniteVideoGrid,
  decorators: [withKnobs],
}

const fakeVideo: VideoFields = {
  id: 'videoId',
  title: 'fake video',
  description: 'this is an awesome video',
  views: 271412,
  duration: 167,
  thumbnailURL: 'https://source.unsplash.com/7MAjXGUmaPw/640x380',
  publishedOnJoystreamAt: new Date(),
  media: {
    location: {
      host: '',
      port: null,
    },
  },
  channel: {
    id: 'channelId',
    avatarPhotoURL: 'https://source.unsplash.com/collection/781477/320x320',
    handle: 'channel name',
  },
}

export const Primary = () => {
  const [videos, setVideos] = useState<VideoFields[]>([])

  const loadVideos = useCallback(
    async (offset: number, limit: number) => {
      // simulate request
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const newVideos = Array.from({ length: limit }, () => fakeVideo)
      setVideos([...videos, ...newVideos])
    },
    [videos]
  )

  return (
    <>
      <Spacer />
      <InfiniteVideoGrid videos={videos} loadVideos={loadVideos} />
    </>
  )
}

const Spacer = styled.div`
  padding-top: 200px;
`
