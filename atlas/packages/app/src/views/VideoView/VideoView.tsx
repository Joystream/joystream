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
import Video from '../../types/video'
import { DateTime } from 'luxon'
import { formatDateShort } from '../../utils/date'
import { formatNumber } from '../../utils/number'
import { MOCK_VIDEOS } from '../../config/mockData'

const FAKE_VIDEO: Video = {
  title: 'Sample Video Title',
  description:
    'Recounting her story of finding opportunity and stability in the US, Elizabeth Camarillo Gutierrez examines the flaws in narratives that simplify and idealize the immigrant experience -- and shares hard-earned wisdom on the best way to help those around us. "Our world is one that flourishes when different voices come together," she says.\nRecounting her story of finding opportunity and stability in the US, Elizabeth Camarillo Gutierrez examines the flaws in narratives that simplify and idealize the immigrant experience -- and shares hard-earned wisdom on the best way to help those around us. "Our world is one that flourishes when different voices come together," she says.',
  views: 240737,
  createdAt: DateTime.local(),
  channel: {
    name: 'Channel Name',
  },
}

const VideoView: React.FC<RouteComponentProps> = () => {
  const { title, views, createdAt, channel, description } = FAKE_VIDEO

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
            {MOCK_VIDEOS.map((v, idx) => (
              <MoreVideosPreview key={idx} {...v} />
            ))}
          </MoreVideosGrid>
        </MoreVideosContainer>
      </InfoContainer>
    </Container>
  )
}

export default VideoView
