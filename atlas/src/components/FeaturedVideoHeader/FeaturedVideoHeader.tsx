import React from 'react'
import {
  BackgroundImage,
  Container,
  InfoContainer,
  MediaWrapper,
  PlayButton,
  StyledAvatar,
  TitleContainer,
} from './FeaturedVideoHeader.style'

const FeaturedVideoHeader: React.FC = () => {
  return (
    <Container>
      <MediaWrapper>
        <BackgroundImage />
      </MediaWrapper>
      <InfoContainer>
        <StyledAvatar img="https://eu-central-1.linodeobjects.com/atlas-assets/feautured-video-channel-avatar.png" />
        <TitleContainer>
          <h2>Ghost Signals</h2>
          <span>How We Lost Trust In Authority, And Authority Taught Us To Distrust Ourselves</span>
        </TitleContainer>
        <PlayButton>Play</PlayButton>
      </InfoContainer>
    </Container>
  )
}

export default FeaturedVideoHeader
