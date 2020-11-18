import React, { useEffect } from 'react'
import { navigate, RouteComponentProps, useParams } from '@reach/router'
import {
  ChannelContainer,
  Container,
  DescriptionContainer,
  DescriptionPlaceholder,
  InfoContainer,
  Meta,
  MoreVideosContainer,
  MoreVideosHeader,
  PlayerContainer,
  PlayerPlaceholder,
  PlayerWrapper,
  StyledChannelAvatar,
  Title,
} from './VideoView.style'
import { PlaceholderVideoGrid, VideoGrid } from '@/components'
import { Placeholder, VideoPlayer } from '@/shared/components'
import { useMutation, useQuery } from '@apollo/client'
import { ADD_VIDEO_VIEW, GET_VIDEO_WITH_CHANNEL_VIDEOS } from '@/api/queries'
import { GetVideo, GetVideoVariables } from '@/api/queries/__generated__/GetVideo'
import routes from '@/config/routes'
import { formatVideoViewsAndDate } from '@/utils/video'
import { AddVideoView, AddVideoViewVariables } from '@/api/queries/__generated__/AddVideoView'

const VideoView: React.FC<RouteComponentProps> = () => {
  const { id } = useParams()
  const { loading, data, error } = useQuery<GetVideo, GetVideoVariables>(GET_VIDEO_WITH_CHANNEL_VIDEOS, {
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

  if(error) {
    throw error
  }

  if (!loading && !data?.video) {
    return <p>Video not found</p>
  }

  return (
    <Container>
      <PlayerWrapper>
        <PlayerContainer>
          {data?.video ? <VideoPlayer src={data.video.media.location} autoplay fluid /> : <PlayerPlaceholder />}
        </PlayerContainer>
      </PlayerWrapper>
      <InfoContainer>
        {data?.video ? <Title>{data.video.title}</Title> : <Placeholder height={46} width={400} />}
        <Meta>
          {data?.video ? (
            formatVideoViewsAndDate(data.video.views, data.video.createdAt, { fullViews: true })
          ) : (
            <Placeholder height={18} width={200} />
          )}
        </Meta>
        <ChannelContainer>
          {data?.video ? (
            <StyledChannelAvatar
              name={data.video.channel.handle}
              avatarUrl={data.video.channel.avatarPhotoUrl}
              onClick={() => navigate(routes.channel(data.video!.channel.id))}
            />
          ) : (
            <Placeholder height={32} width={200} />
          )}
        </ChannelContainer>
        <DescriptionContainer>
          {data?.video ? (
            <>
              {data.video.description.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </>
          ) : (
            <>
              <DescriptionPlaceholder width={700} />
              <DescriptionPlaceholder width={400} />
              <DescriptionPlaceholder width={800} />
              <DescriptionPlaceholder width={300} />
            </>
          )}
        </DescriptionContainer>
        <MoreVideosContainer>
          <MoreVideosHeader>
            {data?.video ? `More from ${data.video.channel.handle}` : <Placeholder height={23} width={300} />}
          </MoreVideosHeader>
          {data?.video ? (
            <VideoGrid videos={data.video.channel.videos} showChannel={false} />
          ) : (
            <PlaceholderVideoGrid />
          )}
        </MoreVideosContainer>
      </InfoContainer>
    </Container>
  )
}

export default VideoView
