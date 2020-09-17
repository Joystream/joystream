import React from 'react'
import styled from '@emotion/styled'
import { navigate } from '@reach/router'

import routes from '@/config/routes'
import { spacing } from '@/shared/theme'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import { VideoPreview } from '@/shared/components'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  grid-gap: ${spacing.xl};
`

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
          key={idx}
          title={v.title}
          channelName={v.channel.handle}
          channelAvatarURL={v.channel.avatarPhotoURL}
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
