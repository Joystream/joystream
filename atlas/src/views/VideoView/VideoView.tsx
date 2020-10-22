import React, { useEffect } from 'react'
import { navigate, RouteComponentProps, useParams } from '@reach/router'
import {
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
import { VideoPlayer } from '@/shared/components'
import { useMutation, useQuery } from '@apollo/client'
import { ADD_VIDEO_VIEW, GET_VIDEO_WITH_CHANNEL_VIDEOS } from '@/api/queries'
import { GetVideo, GetVideoVariables } from '@/api/queries/__generated__/GetVideo'
import routes from '@/config/routes'
import { formatVideoViewsAndDate } from '@/utils/video'
import { AddVideoView, AddVideoViewVariables } from '@/api/queries/__generated__/AddVideoView'

const VideoView: React.FC<RouteComponentProps> = () => {
  const { id } = useParams()
  const { loading, data } = useQuery<GetVideo, GetVideoVariables>(GET_VIDEO_WITH_CHANNEL_VIDEOS, {
    variables: { id },
  })
  const [addVideoView] = useMutation<AddVideoView, AddVideoViewVariables>(ADD_VIDEO_VIEW)

  const videoID = data?.video?.id

  useEffect(() => {
    if (!videoID) {
      return
    }
    addVideoView({
      variables: { id: videoID },
      update: (cache, mutationResult) => {
        cache.modify({
          id: cache.identify({
            __typename: 'Video',
            id: videoID,
          }),
          fields: {
            views: () => mutationResult.data?.addVideoView.views,
          },
        })
      },
    }).catch((error) => {
      console.warn('Failed to increase video views', { error })
    })
  }, [addVideoView, videoID])

  if (loading || !data) {
    return <p>Loading</p>
  }

  if (!data.video) {
    return <p>Video not found</p>
  }

  const { title, views, publishedOnJoystreamAt, channel, description } = data.video

  const descriptionLines = description.split('\n')

  return (
    <Container>
      <PlayerContainer>
        <VideoPlayer src={data.video.media.location} height={700} autoplay />
      </PlayerContainer>
      <InfoContainer>
        <TitleActionsContainer>
          <Title>{title}</Title>
        </TitleActionsContainer>
        <Meta>{formatVideoViewsAndDate(views, publishedOnJoystreamAt, { fullViews: true })}</Meta>
        <StyledChannelAvatar
          name={channel.handle}
          avatarUrl={channel.avatarPhotoURL}
          onClick={() => navigate(routes.channel(channel.id))}
        />
        <DescriptionContainer>
          {descriptionLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </DescriptionContainer>
        <MoreVideosContainer>
          <MoreVideosHeader>More from {channel.handle}</MoreVideosHeader>
          <VideoGrid videos={channel.videos} />
        </MoreVideosContainer>
      </InfoContainer>
    </Container>
  )
}

export default VideoView
