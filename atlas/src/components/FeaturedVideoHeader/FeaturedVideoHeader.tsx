import React from 'react'
import {
  BackgroundImage,
  ChannelLink,
  Container,
  InfoContainer,
  MediaWrapper,
  PlayButton,
  StyledAvatar,
  TitleContainer,
} from './FeaturedVideoHeader.style'
import { mockCoverVideo, mockCoverVideoChannel } from '@/mocking/data/mockCoverVideo'
import { navigate } from '@reach/router'
import routes from '@/config/routes'

const FeaturedVideoHeader: React.FC = () => {
  return (
    <Container>
      <MediaWrapper>
        <BackgroundImage src={mockCoverVideo.thumbnailUrl} />
      </MediaWrapper>
      <InfoContainer>
        <ChannelLink to={routes.channel(mockCoverVideoChannel.id)}>
          <StyledAvatar img={mockCoverVideoChannel.avatarPhotoUrl} name={mockCoverVideoChannel.handle} />
        </ChannelLink>
        <TitleContainer>
          <h2>{mockCoverVideo.title}</h2>
          <span>{mockCoverVideo.description}</span>
        </TitleContainer>
        <PlayButton onClick={() => navigate(routes.video(mockCoverVideo.id))}>Play</PlayButton>
      </InfoContainer>
    </Container>
  )
}

export default FeaturedVideoHeader
