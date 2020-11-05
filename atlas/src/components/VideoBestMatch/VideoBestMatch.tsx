import React from 'react'

import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { formatVideoViewsAndDate } from '@/utils/video'
import {
  Container,
  Content,
  InnerContainer,
  Poster,
  PosterContainer,
  Title,
  TitleContainer,
} from './VideoBestMatch.style'

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
      <PosterContainer>
        <Poster src={thumbnailURL} onClick={onClick} />
      </PosterContainer>
      <InnerContainer>
        <TitleContainer>
          <Title>{title}</Title>
          <span>{formatVideoViewsAndDate(views, publishedOnJoystreamAt, { fullViews: true })}</span>
        </TitleContainer>
      </InnerContainer>
    </Content>
  </Container>
)
export default BestVideoMatch
