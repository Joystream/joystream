import React, { useState } from 'react'
import {
  ButtonsContainer,
  ChannelLink,
  Container,
  HorizontalGradientOverlay,
  InfoContainer,
  Media,
  MediaWrapper,
  PlayButton,
  PlayerContainer,
  SoundButton,
  StyledAvatar,
  TitleContainer,
  VerticalGradientOverlay,
} from './FeaturedVideoHeader.style'
import { CSSTransition } from 'react-transition-group'
import { mockCoverVideo, mockCoverVideoChannel, mockCoverVideoMedia } from '@/mocking/data/mockCoverVideo'
import routes from '@/config/routes'
import { VideoPlayer } from '@/shared/components'
import { Link } from '@reach/router'

const FeaturedVideoHeader: React.FC = () => {
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [soundMuted, setSoundMuted] = useState(true)

  const handlePlaybackDataLoaded = () => {
    setInitialLoadDone(true)
    setVideoPlaying(true)
  }

  const handlePlayPauseClick = () => {
    setVideoPlaying(!videoPlaying)
  }

  const handleSoundToggleClick = () => {
    setSoundMuted(!soundMuted)
  }

  return (
    <Container>
      <MediaWrapper>
        <Media>
          <PlayerContainer>
            <VideoPlayer
              fluid
              isInBackground
              muted={soundMuted}
              playing={videoPlaying}
              posterUrl={mockCoverVideo.thumbnailUrl}
              onDataLoaded={handlePlaybackDataLoaded}
              src={mockCoverVideoMedia.location}
            />
          </PlayerContainer>
          <HorizontalGradientOverlay />
          <VerticalGradientOverlay />
        </Media>
      </MediaWrapper>
      <InfoContainer>
        <ChannelLink to={routes.channel(mockCoverVideoChannel.id)}>
          <StyledAvatar img={mockCoverVideoChannel.avatarPhotoUrl} name={mockCoverVideoChannel.handle} />
        </ChannelLink>
        <TitleContainer>
          <Link to={routes.video(mockCoverVideo.id)}>
            <h2>{mockCoverVideo.title}</h2>
          </Link>
          <span>{mockCoverVideo.description}</span>
        </TitleContainer>
        <CSSTransition in={initialLoadDone} timeout={200} classNames="fade">
          <ButtonsContainer>
            <PlayButton
              onClick={handlePlayPauseClick}
              icon={videoPlaying ? 'pause' : 'play'}
              disabled={!initialLoadDone}
            >
              {videoPlaying ? 'Pause' : 'Play'}
            </PlayButton>
            <SoundButton
              onClick={handleSoundToggleClick}
              icon={soundMuted ? 'sound-on' : 'sound-off'}
              disabled={!initialLoadDone}
            />
          </ButtonsContainer>
        </CSSTransition>
      </InfoContainer>
    </Container>
  )
}

export default FeaturedVideoHeader
