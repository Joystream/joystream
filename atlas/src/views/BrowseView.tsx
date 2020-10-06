import React, { useCallback, useState } from 'react'
import styled from '@emotion/styled'
import { RouteComponentProps } from '@reach/router'
import {
  CategoryPicker,
  InfiniteVideoGrid,
  INITIAL_ROWS,
  Typography,
  INITIAL_VIDEOS_PER_ROW,
} from '@/shared/components'
import { colors, sizes } from '@/shared/theme'
import { useLazyQuery, useQuery } from '@apollo/client'
import { GET_CATEGORIES, GET_VIDEOS } from '@/api/queries'
import { GetCategories } from '@/api/queries/__generated__/GetCategories'
import { CategoryFields } from '@/api/queries/__generated__/CategoryFields'
import { GetVideos, GetVideosVariables } from '@/api/queries/__generated__/GetVideos'

const BrowseView: React.FC<RouteComponentProps> = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const { loading: categoriesLoading, data: categoriesData } = useQuery<GetCategories>(GET_CATEGORIES, {
    onCompleted: (data) => handleCategoryChange(data.categories[0]),
  })
  const [
    loadVideos,
    { data: videosData, fetchMore: fetchMoreVideos, refetch: refetchVideos, variables: videoQueryVariables },
  ] = useLazyQuery<GetVideos, GetVideosVariables>(GET_VIDEOS, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  })

  const handleCategoryChange = (category: CategoryFields) => {
    setSelectedCategoryId(category.id)

    // TODO: don't require this component to know the initial number of items
    // I didn't have an idea on how to achieve that for now
    // it will need to be reworked in some part anyway during switching to relay pagination
    const variables = { offset: 0, limit: INITIAL_ROWS * INITIAL_VIDEOS_PER_ROW, categoryId: category.id }

    if (!selectedCategoryId) {
      // first videos fetch
      loadVideos({ variables })
    } else if (refetchVideos) {
      refetchVideos(variables)
    }
  }

  const handleLoadVideos = useCallback(
    (offset: number, limit: number) => {
      if (!selectedCategoryId || !fetchMoreVideos) {
        return
      }

      const variables = { offset, limit, categoryId: selectedCategoryId }
      fetchMoreVideos({ variables })
    },
    [selectedCategoryId, fetchMoreVideos]
  )

  return (
    <div>
      <Header variant="hero">Browse</Header>
      <Typography variant="h5">Topics that may interest you</Typography>
      <StyledCategoryPicker
        categories={categoriesData?.categories}
        loading={categoriesLoading}
        selectedCategoryId={selectedCategoryId}
        onChange={handleCategoryChange}
      />
      <InfiniteVideoGrid
        key={videoQueryVariables?.categoryId || ''}
        loadVideos={handleLoadVideos}
        videos={videosData?.videos}
        initialLoading={categoriesLoading}
      />
    </div>
  )
}

const Header = styled(Typography)`
  margin: ${sizes.b1 * 14}px 0 ${sizes.b10}px 0; // 56px 40px
`

const StyledCategoryPicker = styled(CategoryPicker)`
  z-index: 10;
  position: sticky;
  top: 0;
  padding-top: ${sizes.b5}px;
  padding-bottom: ${sizes.b2}px;
  background-color: ${colors.black};
`

export default BrowseView
