import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { spacing, typography } from '../../theme'
import { VideoPreview, VideoPreviewBase } from '..'
import sizes from '@/shared/theme/sizes'
import { debounce } from 'lodash'

type InfiniteVideoGridProps = {
  title?: string
  videos?: VideoFields[]
  loadVideos: (offset: number, limit: number) => void
  className?: string
}

const INITIAL_ROWS = 2
const VIDEOS_PER_ROW = 4

const InfiniteVideoGrid: React.FC<InfiniteVideoGridProps> = ({ title, videos, loadVideos, className }) => {
  // TODO: base this on the container width and some responsive items/row
  const videosPerRow = VIDEOS_PER_ROW

  const [currentRowsCount, setCurrentRowsCount] = useState(INITIAL_ROWS)

  const targetVideosCount = currentRowsCount * videosPerRow
  const loadedVideosCount = videos?.length || 0

  useEffect(() => {
    if (targetVideosCount > loadedVideosCount) {
      const missingVideosCount = targetVideosCount - loadedVideosCount
      loadVideos(loadedVideosCount, missingVideosCount)
      // TODO: handle a situation when there are no more videos to fetch
      // this will require query node to provide some pagination metadata (total items count at minimum)
    }
  }, [loadedVideosCount, targetVideosCount, loadVideos])

  const videoRowsCount = Math.floor(loadedVideosCount / videosPerRow)
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
      {displayedVideos.map((v, idx) => (
        <StyledVideoPreview
          title={v.title}
          channelName={v.channel.handle}
          createdAt={v.publishedOnJoystreamAt}
          views={v.views}
          posterURL={v.thumbnailURL}
          key={`${v.id}-${idx}`} // TODO: remove idx from key once we get the real data without duplicated IDs
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
      <Grid videosPerRow={videosPerRow}>{gridContent}</Grid>
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

const Grid = styled.div<{ videosPerRow: number }>`
  display: grid;
  grid-template-columns: repeat(${({ videosPerRow }) => videosPerRow}, 1fr);
  grid-gap: ${spacing.xl};
`

export default InfiniteVideoGrid
