import React from 'react'

import { navigate } from '@reach/router'
import { VideoPreview } from '@/shared/components'

import routes from '@/config/routes'

type VideoPreviewWithNavigationProps = {
  id: string
  channelId: string
} & React.ComponentProps<typeof VideoPreview>

const VideoPreviewWithNavigation: React.FC<VideoPreviewWithNavigationProps> = ({
  id,
  channelId,
  onClick,
  onChannelClick,
  ...videoPreviewProps
}) => {
  const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (onClick) {
      onClick(e)
    }
    navigate(routes.video(id))
  }
  const handleChannelClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (onChannelClick) {
      onChannelClick(e)
    }
    navigate(routes.channel(channelId))
  }
  return <VideoPreview {...videoPreviewProps} onClick={handleClick} onChannelClick={handleChannelClick} />
}

export default VideoPreviewWithNavigation
