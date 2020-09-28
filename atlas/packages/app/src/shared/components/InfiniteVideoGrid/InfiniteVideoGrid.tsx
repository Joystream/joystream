import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { spacing, typography } from '../../theme'
import { VideoPreview, VideoPreviewBase, Grid } from '..'
import sizes from '@/shared/theme/sizes'
import { debounce } from 'lodash'

type InfiniteVideoGridProps = {
  title?: string
  videos?: VideoFields[]
  loadVideos: (offset: number, limit: number) => void
  initialOffset?: number
  initialLoading?: boolean
  className?: string
}

export const INITIAL_ROWS = 4
export const INITIAL_VIDEOS_PER_ROW = 4

const InfiniteVideoGrid: React.FC<InfiniteVideoGridProps> = ({
  title,
  videos,
  loadVideos,
  initialOffset = 0,
  initialLoading,
  className,
}) => {
  const [videosPerRow, setVideosPerRow] = useState(INITIAL_VIDEOS_PER_ROW)

  const loadedVideosCount = videos?.length || 0
  const videoRowsCount = Math.floor(loadedVideosCount / videosPerRow)
  const initialRows = Math.max(videoRowsCount, INITIAL_ROWS)

  const [currentRowsCount, setCurrentRowsCount] = useState(initialRows)

  const targetVideosCount = currentRowsCount * videosPerRow

  useEffect(() => {
    if (initialLoading) {
      return
    }

    if (targetVideosCount > loadedVideosCount) {
      const offset = initialOffset + loadedVideosCount
      const missingVideosCount = targetVideosCount - loadedVideosCount
      loadVideos(offset, missingVideosCount)
      // TODO: handle a situation when there are no more videos to fetch
      // this will require query node to provide some pagination metadata (total items count at minimum)
    }
  }, [initialOffset, initialLoading, loadedVideosCount, targetVideosCount, loadVideos])

  const displayedVideos = videos?.slice(0, videoRowsCount * videosPerRow) || []
  const placeholderRowsCount = currentRowsCount - videoRowsCount
  const placeholdersCount = placeholderRowsCount * videosPerRow

  useEffect(() => {
    const scrollHandler = debounce(() => {
      const scrolledToBottom =
        window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight

      if (scrolledToBottom && placeholdersCount === 0) {
        setCurrentRowsCount(currentRowsCount + 2)
      }
    }, 100)
    window.addEventListener('scroll', scrollHandler)
    return () => {
      window.removeEventListener('scroll', scrollHandler)
    }
  }, [currentRowsCount, placeholdersCount])

  const gridContent = (
    <>
      {displayedVideos.map((v) => (
        <StyledVideoPreview
          title={v.title}
          channelName={v.channel.handle}
          channelAvatarURL={v.channel.avatarPhotoURL}
          createdAt={v.publishedOnJoystreamAt}
          views={v.views}
          posterURL={v.thumbnailURL}
          key={v.id}
        />
      ))}
      {Array.from({ length: placeholdersCount }, (_, idx) => (
        <StyledVideoPreviewBase key={idx} />
      ))}
    </>
  )

  return (
    <section className={className}>
      {title && <Title>{title}</Title>}
      <Grid onResize={(sizes) => setVideosPerRow(sizes.length)}>{gridContent}</Grid>
    </section>
  )
}

const Title = styled.h4`
  margin: 0 0 ${sizes.b4};
  font-size: ${typography.sizes.h5};
`

const StyledVideoPreview = styled(VideoPreview)`
  margin: 0 auto;
  width: 100%;
`

const StyledVideoPreviewBase = styled(VideoPreviewBase)`
  margin: 0 auto;
  width: 100%;
`

export default InfiniteVideoGrid
