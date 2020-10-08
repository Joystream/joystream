import React from 'react'
import { navigate } from '@reach/router'

import { ChannelPreview } from '@/shared/components'
import routes from '@/config/routes'

type ChannelPreviewWithNavigationProps = {
  id?: string
} & React.ComponentProps<typeof ChannelPreview>

const ChannelPreviewWithNavigation: React.FC<ChannelPreviewWithNavigationProps> = ({
  id,
  onClick,
  ...channelPreviewProps
}) => {
  const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (onClick) {
      onClick(e)
    }
    navigate(routes.channel(id))
  }
  return <ChannelPreview {...channelPreviewProps} onClick={handleClick} />
}
export default ChannelPreviewWithNavigation
