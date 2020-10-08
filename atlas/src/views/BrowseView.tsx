import React, { useState } from 'react'
import styled from '@emotion/styled'
import { RouteComponentProps } from '@reach/router'
import { CategoryPicker, InfiniteVideoGrid, Typography } from '@/shared/components'
import { colors, sizes } from '@/shared/theme'
import { useQuery } from '@apollo/client'
import { GET_CATEGORIES } from '@/api/queries'
import { GetCategories } from '@/api/queries/__generated__/GetCategories'
import { CategoryFields } from '@/api/queries/__generated__/CategoryFields'

const BrowseView: React.FC<RouteComponentProps> = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const { loading: categoriesLoading, data: categoriesData } = useQuery<GetCategories>(GET_CATEGORIES, {
    onCompleted: (data) => handleCategoryChange(data.categories[0]),
  })

  const handleCategoryChange = (category: CategoryFields) => {
    setSelectedCategoryId(category.id)
  }

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
      <StyledInfiniteVideoGrid categoryId={selectedCategoryId || undefined} ready={!!selectedCategoryId} />
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
  padding: ${sizes.b5}px ${sizes.b8}px ${sizes.b2}px;
  margin: 0 -${sizes.b8}px;
  background-color: ${colors.black};
`
const StyledInfiniteVideoGrid = styled(InfiniteVideoGrid)`
  padding-top: ${sizes.b2}px;
`
export default BrowseView
