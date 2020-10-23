import React from 'react'
import styled from '@emotion/styled'
import { FallbackProps } from 'react-error-boundary'
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

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Container>
      <p>Something went wrong:</p>
      <pre>{error?.message}</pre>
      <StyledButton variant="tertiary" onClick={resetErrorBoundary}>
        Try again
      </StyledButton>
    </Container>
  )
}

export default ErrorFallback
