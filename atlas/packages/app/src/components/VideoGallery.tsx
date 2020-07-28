import React, { useCallback, useState } from 'react'
import { css, SerializedStyles } from '@emotion/core'
import { navigate } from '@reach/router'

import { Gallery, VideoPreview } from '@/shared/components'
import { MOCK_VIDEOS } from '@/config/mockData'

type VideoGalleryProps = {
  title: string
  action: string
}

const articleStyles = css`
  max-width: 320px;
  margin-right: 1.25rem;
`

const VideoGallery: React.FC<Partial<VideoGalleryProps>> = ({ title, action }) => {
  const videos = [...MOCK_VIDEOS, ...MOCK_VIDEOS, ...MOCK_VIDEOS]
  const [controlsTop, setControlsTop] = useState<SerializedStyles>(css``)

  const CAROUSEL_WHEEL_HEIGHT = 48
  const imgRef = useCallback((node: HTMLImageElement) => {
    if (node != null) {
      setControlsTop(css`
        top: calc(${Math.round(node.clientHeight) / 2}px - ${CAROUSEL_WHEEL_HEIGHT / 2}px);
      `)
    }
  }, [])

  const handleVideoClick = () => {
    navigate('/video/fake')
  }

  return (
    <Gallery title={title} action={action} leftControlCss={controlsTop} rightControlCss={controlsTop}>
      {videos.map((video, idx) => (
        <article css={articleStyles} key={`${title}- ${video.title} - ${idx}`}>
          <VideoPreview
            title={video.title}
            channel={video.channel}
            showChannel={video.showChannel}
            views={video.views}
            createdAt={video.createdAt}
            imgRef={idx === 0 ? imgRef : null}
            poster={video.poster}
            showMeta={true}
            onClick={handleVideoClick}
          />
        </article>
      ))}
    </Gallery>
  )
}

export default VideoGallery
