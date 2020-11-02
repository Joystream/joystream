import React from 'react'
import { RouteComponentProps, useParams } from '@reach/router'
import { useQuery } from '@apollo/client'

import { GET_CHANNEL } from '@/api/queries/channels'
import { GetChannel, GetChannelVariables } from '@/api/queries/__generated__/GetChannel'
import { VideoGrid } from '@/components'

import { Header, StyledAvatar, Title, TitleSection, VideoSection } from './ChannelView.style'

const ChannelView: React.FC<RouteComponentProps> = () => {
  const { id } = useParams()
  const { loading, data } = useQuery<GetChannel, GetChannelVariables>(GET_CHANNEL, {
    variables: { id },
  })

  if (loading || !data?.channel) {
    return <p>Loading Channel...</p>
  }
  const videos = data?.channel?.videos || []

  return (
    <div>
      <Header coverPhotoURL={data.channel.coverPhotoURL}>
        <TitleSection>
          <StyledAvatar img={data.channel.avatarPhotoURL} name={data.channel.handle} />
          <Title>{data.channel.handle}</Title>
        </TitleSection>
      </Header>
      {videos.length > 0 && (
        <VideoSection>
          <VideoGrid videos={videos} />
        </VideoSection>
      )}
    </div>
  )
}
export default ChannelView
