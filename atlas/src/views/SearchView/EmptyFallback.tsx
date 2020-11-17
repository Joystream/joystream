import React from 'react'
import styled from '@emotion/styled'

import { ReactComponent as EmptyStateIllustration } from '@/assets/empty-state-illustration.svg'
import { Typography } from '@/shared/components'
import { sizes } from '@/shared/theme'

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
  }
`

const Title = styled(Typography)`
  line-height: 1.25;
`

const EmptyFallback: React.FC = () => (
  <Container>
    <EmptyStateIllustration />
    <Message>
      <Title variant="h3">Sorry, we couldn&apos;t find any matches.</Title>
      <p></p>
    </Message>
  </Container>
)

export default EmptyFallback
