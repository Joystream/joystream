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
import { formatDateAgo } from '@/utils/time'
import { formatNumber } from '@/utils/number'
import { useQuery } from '@apollo/client'
import { GET_NEWEST_VIDEOS } from '@/api/queries'
import { GetNewestVideos } from '@/api/queries/__generated__/GetNewestVideos'

const VideoView: React.FC<RouteComponentProps> = () => {
  const { loading, data } = useQuery<GetNewestVideos>(GET_NEWEST_VIDEOS)

  if (loading || !data) {
    return <p>Loading</p>
  }

  const { title, views, publishedOnJoystreamAt, channel, description } = data.videos[0]

  const descriptionLines = description.split('\n')

  const moreVideos = Array.from({ length: 10 }, () => data.videos[0])

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
          {formatNumber(views)} views • {formatDateAgo(publishedOnJoystreamAt)}
        </Meta>
        <StyledChannelAvatar name={channel.handle} avatarUrl={channel.avatarPhotoURL} />
        <DescriptionContainer>
          {descriptionLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </DescriptionContainer>
        <MoreVideosContainer>
          <MoreVideosHeader>More from {channel.handle}</MoreVideosHeader>
          <MoreVideosGrid>
            {moreVideos.map((v, idx) => (
              <MoreVideosPreview
                key={idx}
                title={v.title}
                channelName={v.channel.handle}
                createdAt={v.publishedOnJoystreamAt}
                duration={v.duration}
                views={v.views}
                posterURL={v.thumbnailURL}
              />
            ))}
          </MoreVideosGrid>
        </MoreVideosContainer>
      </InfoContainer>
    </Container>
  )
}

export default VideoView
