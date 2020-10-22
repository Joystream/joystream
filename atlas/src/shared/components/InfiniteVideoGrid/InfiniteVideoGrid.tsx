import React, { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { debounce } from 'lodash'
import { useLazyQuery } from '@apollo/client'

import { typography, sizes } from '../../theme'
import { VideoPreviewBase } from '../VideoPreview'
import Grid from '../Grid'
import VideoPreview from '@/components/VideoPreviewWithNavigation'
import { GET_NEWEST_VIDEOS } from '@/api/queries'
import { GetNewestVideos, GetNewestVideosVariables } from '@/api/queries/__generated__/GetNewestVideos'

type InfiniteVideoGridProps = {
  title?: string
  categoryId?: string
  skipCount?: number
  ready?: boolean
  className?: string
}

const INITIAL_ROWS = 4
const INITIAL_VIDEOS_PER_ROW = 4

const InfiniteVideoGrid: React.FC<InfiniteVideoGridProps> = ({
  title,
  categoryId = '',
  skipCount = 0,
  ready = true,
  className,
}) => {
  const [videosPerRow, setVideosPerRow] = useState(INITIAL_VIDEOS_PER_ROW)

  const [targetRowsCountByCategory, setTargetRowsCountByCategory] = useState<Record<string, number>>({
    [categoryId]: INITIAL_ROWS,
  })
  const [cachedCategoryId, setCachedCategoryId] = useState<string>(categoryId)

  const targetRowsCount = targetRowsCountByCategory[cachedCategoryId]

  const targetDisplayedVideosCount = targetRowsCount * videosPerRow
  const targetLoadedVideosCount = targetDisplayedVideosCount + skipCount

  const [fetchVideos, { loading, data, fetchMore, called, refetch }] = useLazyQuery<
    GetNewestVideos,
    GetNewestVideosVariables
  >(GET_NEWEST_VIDEOS, {
    notifyOnNetworkStatusChange: true,
  })

  const loadedVideosCount = data?.videosConnection.edges.length || 0
  const allVideosLoaded = data ? !data.videosConnection.pageInfo.hasNextPage : false

  const endCursor = data?.videosConnection.pageInfo.endCursor

  useEffect(() => {
    if (ready && !called) {
      fetchVideos({ variables: { first: targetLoadedVideosCount, categoryId } })
    }
  }, [ready, called, categoryId, targetLoadedVideosCount, fetchVideos])

  useEffect(() => {
    if (categoryId === cachedCategoryId) {
      return
    }

    setCachedCategoryId(categoryId)
    const categoryRowsSet = !!targetRowsCountByCategory[categoryId]
    const categoryRowsCount = categoryRowsSet ? targetRowsCountByCategory[categoryId] : INITIAL_ROWS
    if (!categoryRowsSet) {
      setTargetRowsCountByCategory((prevState) => ({
        ...prevState,
        [categoryId]: categoryRowsCount,
      }))
    }

    if (!called || !refetch) {
      return
    }

    refetch({ first: categoryRowsCount * videosPerRow + skipCount, categoryId })
  }, [categoryId, cachedCategoryId, targetRowsCountByCategory, called, refetch, videosPerRow, skipCount])

  useEffect(() => {
    if (loading || !fetchMore || allVideosLoaded) {
      return
    }

    if (targetLoadedVideosCount > loadedVideosCount) {
      const videosToLoadCount = targetLoadedVideosCount - loadedVideosCount
      fetchMore({ variables: { first: videosToLoadCount, after: endCursor, categoryId } })
    }
  }, [loading, loadedVideosCount, targetLoadedVideosCount, allVideosLoaded, fetchMore, endCursor, categoryId])

  useEffect(() => {
    const scrollHandler = debounce(() => {
      const scrolledToBottom =
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight
      if (scrolledToBottom && ready && !loading && !allVideosLoaded) {
        setTargetRowsCountByCategory((prevState) => ({
          ...prevState,
          [cachedCategoryId]: targetRowsCount + 2,
        }))
      }
    }, 100)
    window.addEventListener('scroll', scrollHandler)
    return () => {
      window.removeEventListener('scroll', scrollHandler)
    }
  }, [targetRowsCount, ready, loading, allVideosLoaded, cachedCategoryId])

  const displayedEdges = data?.videosConnection.edges.slice(skipCount, targetLoadedVideosCount) || []
  const displayedVideos = displayedEdges.map((edge) => edge.node)

  const targetDisplayedItemsCount = data
    ? Math.min(targetDisplayedVideosCount, data.videosConnection.totalCount - skipCount)
    : targetDisplayedVideosCount
  const placeholdersCount = targetDisplayedItemsCount - displayedVideos.length

  const gridContent = (
    <>
      {displayedVideos.map((v) => (
        <StyledVideoPreview
          id={v.id}
          channelId={v.channel.id}
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
