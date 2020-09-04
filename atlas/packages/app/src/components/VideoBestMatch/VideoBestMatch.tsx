import React from 'react'

import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { formatNumber } from '@/utils/number'
import { formatDate } from '@/utils/time'
import { Container, Content, InnerContainer, TitleContainer, Title, Poster } from './VideoBestMatch.style'

type BestVideoMatchProps = {
  video: VideoFields
  onClick: (e: React.MouseEvent<HTMLImageElement>) => void
}

const BestVideoMatch: React.FC<BestVideoMatchProps> = ({
  video: { thumbnailURL, title, views, publishedOnJoystreamAt },
  onClick,
}) => (
  <Container>
    <h3>Best Match</h3>
    <Content>
      <Poster src={thumbnailURL} onClick={onClick} />
      <InnerContainer>
        <TitleContainer>
          <Title>{title}</Title>
          <span>
            {formatNumber(views)} views • {formatDate(publishedOnJoystreamAt)}
          </span>
        </TitleContainer>
      </InnerContainer>
    </Content>
  </Container>
)
export default BestVideoMatch
