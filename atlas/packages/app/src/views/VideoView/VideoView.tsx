import React from 'react'
import { RouteComponentProps, useParams } from '@reach/router'
import {
  ActionsContainer,
  Container,
  DescriptionContainer,
  InfoContainer,
  Meta,
  MoreVideosContainer,
  MoreVideosHeader,
  PlayerContainer,
  StyledChannelAvatar,
  Title,
  TitleActionsContainer,
} from './VideoView.style'
import { VideoGrid } from '@/components'
import { Button, VideoPlayer } from '@/shared/components'
import { formatDateAgo } from '@/utils/time'
import { formatNumber } from '@/utils/number'
import { useQuery } from '@apollo/client'
import { GET_VIDEO } from '@/api/queries'
import { GetVideo, GetVideoVariables } from '@/api/queries/__generated__/GetVideo'

const VideoView: React.FC<RouteComponentProps> = () => {
  const { id } = useParams()
  const { loading, data } = useQuery<GetVideo, GetVideoVariables>(GET_VIDEO, { variables: { id } })

  if (loading || !data) {
    return <p>Loading</p>
  }

  if (!data.video) {
    return <p>Video not found</p>
  }

  const { title, views, publishedOnJoystreamAt, channel, description } = data.video

  const descriptionLines = description.split('\n')

  const moreVideos = Array.from({ length: 10 }, () => data.video as NonNullable<typeof data.video>)

  return (
    <Container>
      <PlayerContainer>
        <VideoPlayer src={data.video.media.location} height={700} autoplay />
      </PlayerContainer>
      <InfoContainer>
        <TitleActionsContainer>
          <Title>{title}</Title>
          <ActionsContainer>
            <Button variant="secondary">Share</Button>
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
          <VideoGrid videos={moreVideos} />
        </MoreVideosContainer>
      </InfoContainer>
    </Container>
  )
}

export default VideoView
