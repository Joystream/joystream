import React from 'react'
import styled from '@emotion/styled'
import { FallbackRender } from '@sentry/react/dist/errorboundary'

import { ReactComponent as ErrorIllustration } from '@/assets/error.svg'
import { Button, Typography } from '@/shared/components'
import { sizes, colors } from '@/shared/theme'

const Container = styled.div`
  margin: ${sizes.b10 * 2}px auto 0;
  display: grid;
  place-items: center;

  > svg {
    max-width: 650px;
  }
`

const Message = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  margin-top: 90px;
  margin-bottom: ${sizes.b10}px;

  > p {
    margin: 0;
    line-height: 1.75;
    color: ${colors.gray[300]};
  }
`

const Title = styled(Typography)`
  line-height: 1.25;
`

const ErrorFallback: FallbackRender = ({ error, componentStack, resetError }) => {
  console.error(`An error occured in ${componentStack}`)
  console.error(error)
  return (
    <Container>
      <ErrorIllustration />
      <Message>
        <Title variant="h3">Oops! An Error occurred.</Title>
        <p>We could not acquire expected results. Please try reloading or return to the home page.</p>
      </Message>
      <Button onClick={resetError}>Return to home page</Button>
    </Container>
  )
}

export default ErrorFallback
