import React from 'react'

import { Grid, VideoPreviewBase } from '@/shared/components'

type PlaceholderVideoGridProps = {
  videosCount?: number
}
const PlaceholderVideoGrid: React.FC<PlaceholderVideoGridProps> = ({ videosCount = 10 }) => {
  return (
    <Grid>
      {Array.from({ length: videosCount }).map((_, idx) => (
        <VideoPreviewBase key={idx} />
      ))}
    </Grid>
  )
}
export default PlaceholderVideoGrid
