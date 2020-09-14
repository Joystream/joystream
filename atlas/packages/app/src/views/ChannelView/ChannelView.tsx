import React from 'react'
import { RouteComponentProps, useParams, navigate } from '@reach/router'
import { useQuery } from '@apollo/client'

import routes from '@/config/routes'
import { GET_FULL_CHANNEL } from '@/api/queries/channels'
import { GetFullChannel, GetFullChannelVariables } from '@/api/queries/__generated__/GetFullChannel'
import { VideoPreview } from '@/shared/components'

import {
  Header,
  VideoSection,
  VideoSectionHeader,
  VideoSectionGrid,
  Title,
  TitleSection,
  StyledAvatar,
} from './ChannelView.style'

const ChannelView: React.FC<RouteComponentProps> = () => {
  const { id } = useParams()
  const { loading, data } = useQuery<GetFullChannel, GetFullChannelVariables>(GET_FULL_CHANNEL, {
    variables: { id },
  })

  if (loading || !data?.channel) {
    return <p>Loading Channel...</p>
  }
  const videos = data?.channel?.videos || []

  const handleVideoClick = (id: string) => {
    navigate(routes.video(id))
  }

  return (
    <div>
      <Header coverPhotoURL={data.channel.coverPhotoURL}>
        <TitleSection>
          <StyledAvatar img={data.channel.avatarPhotoURL} />
          <Title>{data.channel.handle}</Title>
        </TitleSection>
      </Header>
      {videos.length > 0 && (
        <VideoSection>
          <VideoSectionHeader>Videos</VideoSectionHeader>
          <VideoSectionGrid>
            {videos.map((video, idx) => (
              <VideoPreview
                key={idx}
                title={video.title}
                channelName={video.channel.handle}
                channelAvatarURL={video.channel.avatarPhotoURL}
                createdAt={video.publishedOnJoystreamAt}
                duration={video.duration}
                views={video.views}
                posterURL={video.thumbnailURL}
                onClick={() => handleVideoClick(video.id)}
              />
            ))}
          </VideoSectionGrid>
        </VideoSection>
      )}
    </div>
  )
}
export default ChannelView
