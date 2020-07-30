import React from 'react'
import { RouteComponentProps } from '@reach/router'
import {
  ActionsContainer,
  Container,
  DescriptionContainer,
  InfoContainer,
  Meta,
  MoreVideosContainer,
  MoreVideosGrid,
  MoreVideosHeader,
  MoreVideosPreview,
  PlayerContainer,
  StyledChannelAvatar,
  Title,
  TitleActionsContainer,
} from './VideoView.style'
import { Button, VideoPlayer } from '@/shared/components'
import { formatDateShort } from '@/utils/time'
import { formatNumber } from '@/utils/number'
import { mockVideos } from '@/config/mocks'

const VideoView: React.FC<RouteComponentProps> = () => {
  const { title, views, createdAt, channel, description } = mockVideos[0]

  const descriptionLines = description.split('\n')

  return (
    <Container>
      <PlayerContainer>
        <VideoPlayer src="https://js-video-example.s3.eu-central-1.amazonaws.com/waves.mp4" height={700} autoplay />
      </PlayerContainer>
      <InfoContainer>
        <TitleActionsContainer>
          <Title>{title}</Title>
          <ActionsContainer>
            <Button type="secondary">Share</Button>
          </ActionsContainer>
        </TitleActionsContainer>
        <Meta>
          {formatNumber(views)} views • {formatDateShort(createdAt)}
        </Meta>
        <StyledChannelAvatar {...channel} />
        <DescriptionContainer>
          {descriptionLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </DescriptionContainer>
        <MoreVideosContainer>
          <MoreVideosHeader>More from {channel.name}</MoreVideosHeader>
          <MoreVideosGrid>
            {mockVideos.map((v, idx) => (
              <MoreVideosPreview
                key={idx}
                title={v.title}
                channelName={v.channel.name}
                createdAt={v.createdAt}
                duration={v.duration}
                views={v.views}
                posterURL={v.posterURL}
              />
            ))}
          </MoreVideosGrid>
        </MoreVideosContainer>
      </InfoContainer>
    </Container>
  )
}

export default VideoView
