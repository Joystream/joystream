import React from 'react'

import styled from '@emotion/styled'
import { FallbackRender } from '@sentry/react/dist/errorboundary'

import { Button } from '@/shared/components'
import { sizes, colors } from '@/shared/theme'

const Container = styled.div`
  padding: ${sizes.b4}px;
  color: ${colors.gray[400]};
  display: grid;
  place-items: center;
`

const StyledButton = styled(Button)`
  color: ${colors.white};
`
type FallbackProps = Partial<Parameters<FallbackRender>[0]>

const ErrorFallback: React.FC<FallbackProps> = ({ error, componentStack, resetError }) => {
  console.error(`An error occured in ${componentStack}`)
  console.error(error)
  return (
    <Container>
      <p>Something went wrong...</p>
      <StyledButton variant="tertiary" onClick={resetError}>
        Try again
      </StyledButton>
    </Container>
  )
}

export default ErrorFallback
