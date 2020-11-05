import React from 'react'
import styled from '@emotion/styled'

import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'
import { Grid } from '@/shared/components'
import ChannelPreview from './ChannelPreviewWithNavigation'

const StyledChannelPreview = styled(ChannelPreview)`
  margin: 0 auto;
`

type ChannelGridProps = {
  channels: ChannelFields[]
} & React.ComponentProps<typeof Grid>

const ChannelGrid: React.FC<ChannelGridProps> = ({ channels, ...gridProps }) => {
  return (
    <Grid {...gridProps}>
      {channels.map((c) => (
        <StyledChannelPreview key={c.id} id={c.id} name={c.handle} avatarURL={c.avatarPhotoURL} />
      ))}
    </Grid>
  )
}
export default ChannelGrid
