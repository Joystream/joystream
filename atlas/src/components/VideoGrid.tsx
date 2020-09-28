import React from 'react'
import styled from '@emotion/styled'
import { navigate } from '@reach/router'

import routes from '@/config/routes'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { Grid } from '@/shared/components'
import VideoPreview from './VideoPreviewWithNavigation'

const StyledVideoPreview = styled(VideoPreview)`
  margin: 0 auto;
`

type VideoGridProps = {
  videos: VideoFields[]
}
const VideoGrid: React.FC<VideoGridProps> = ({ videos }) => {
  return (
    <Grid>
      {videos.map((v, idx) => (
        <StyledVideoPreview
          id={v.id}
          channelId={v.channel.id}
          key={idx}
          title={v.title}
          channelName={v.channel.handle}
          channelAvatarURL={v.channel.avatarPhotoURL}
          onChannelClick={() => navigate(routes.channel(v.channel.id))}
          createdAt={v.publishedOnJoystreamAt}
          duration={v.duration}
          views={v.views}
          posterURL={v.thumbnailURL}
          onClick={() => navigate(routes.video(v.id))}
        />
      ))}
    </Grid>
  )
}
export default VideoGrid
