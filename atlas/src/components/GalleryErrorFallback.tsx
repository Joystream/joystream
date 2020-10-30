import React from 'react'

import styled from '@emotion/styled'

import { Button } from '@/shared/components'
import { sizes, colors } from '@/shared/theme'

const Container = styled.div`
  padding: ${sizes.b4};
  color: ${colors.gray[400]};
  display: grid;
  place-items: center;
`

const StyledButton = styled(Button)`
  color: ${colors.white};
`
type GalleryFallbackProps = {
  error: any
  reset: () => void
}
const GalleryErrorFallback: React.FC<GalleryFallbackProps> = ({ error, reset }) => {
  console.error(error)
  return (
    <Container>
      <p>Something went wrong...</p>
      <StyledButton variant="tertiary" onClick={reset}>
        Try again
      </StyledButton>
    </Container>
  )
}

export default GalleryErrorFallback
