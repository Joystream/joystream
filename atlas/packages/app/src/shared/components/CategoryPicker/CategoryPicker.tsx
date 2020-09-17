import React from 'react'
import styled from '@emotion/styled'
import { Placeholder, ToggleButton } from '..'
import sizes from '@/shared/theme/sizes'
import { CategoryFields } from '@/api/queries/__generated__/CategoryFields'

type CategoryPickerProps = {
  categories?: CategoryFields[]
  selectedCategoryId: string | null
  loading?: boolean
  onChange: (category: CategoryFields) => void
  className?: string
}

const CATEGORY_PLACEHOLDER_WIDTHS = [80, 170, 120, 110, 80, 170, 120]

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategoryId,
  loading,
  onChange,
  className,
}) => {
  const content =
    !categories || loading
      ? CATEGORY_PLACEHOLDER_WIDTHS.map((width, idx) => (
          <StyledPlaceholder key={`placeholder-${idx}`} width={width} height="48px" />
        ))
      : categories.map((category) => (
          <StyledToggleButton
            key={category.id}
            controlled
            toggled={category.id === selectedCategoryId}
            variant="secondary"
            onClick={() => onChange(category)}
          >
            {category.name}
          </StyledToggleButton>
        ))

  return <Container className={className}>{content}</Container>
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
`

const StyledPlaceholder = styled(Placeholder)`
  margin: 0 ${sizes.b3}px ${sizes.b3}px 0;
`

const StyledToggleButton = styled(ToggleButton)`
  margin: 0 ${sizes.b3}px ${sizes.b3}px 0;
`

export default CategoryPicker
