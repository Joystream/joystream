import React from 'react'
import {
  ChannelName,
  CoverDurationOverlay,
  CoverHoverOverlay,
  CoverImage,
  CoverPlayIcon,
  MetaText,
  ProgressBar,
  ProgressOverlay,
  StyledAvatar,
  TitleHeader,
} from './VideoPreview.styles'
import { formatDateAgo, formatDurationShort } from '@/utils/time'
import { formatNumberShort } from '@/utils/number'
import VideoPreviewBase from './VideoPreviewBase'

type VideoPreviewProps = {
  title: string
  channelName: string
  channelAvatarURL?: string | null
  createdAt: Date
  duration?: number
  // video watch progress in percent (0-100)
  progress?: number
  views: number
  posterURL: string

  showChannel?: boolean
  showMeta?: boolean
  imgRef?: React.Ref<HTMLImageElement>
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  onChannelClick?: (e: React.MouseEvent<HTMLElement>) => void
  className?: string
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  title,
  channelName,
  channelAvatarURL,
  createdAt,
  duration,
  progress = 0,
  views,
  posterURL,
  showChannel = true,
  showMeta = true,
  imgRef,
  onClick,
  onChannelClick,
  className,
}) => {
  const channelClickable = !!onChannelClick

  const handleChannelClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!onChannelClick) {
      return
    }
    e.stopPropagation()
    onChannelClick(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!onClick) {
      return
    }
    e.stopPropagation()
    onClick(e)
  }

  const coverNode = (
    <>
      <CoverImage src={posterURL} ref={imgRef} alt={`${title} by ${channelName} thumbnail`} />
      {duration && <CoverDurationOverlay>{formatDurationShort(duration)}</CoverDurationOverlay>}
      {!!progress && (
        <ProgressOverlay>
          <ProgressBar style={{ width: `${progress}%` }} />
        </ProgressOverlay>
      )}
      <CoverHoverOverlay>
        <CoverPlayIcon />
      </CoverHoverOverlay>
    </>
  )

  const titleNode = <TitleHeader>{title}</TitleHeader>

  const channelAvatarNode = (
    <StyledAvatar
      size="small"
      name={channelName}
      img={channelAvatarURL}
      channelClickable={channelClickable}
      onClick={handleChannelClick}
    />
  )

  const channelNameNode = (
    <ChannelName channelClickable={channelClickable} onClick={handleChannelClick}>
      {channelName}
    </ChannelName>
  )

  const metaNode = (
    <MetaText>
      {formatDateAgo(createdAt)}・{formatNumberShort(views)} views
    </MetaText>
  )

  return (
    <VideoPreviewBase
      coverNode={coverNode}
      titleNode={titleNode}
      showChannel={showChannel}
      channelAvatarNode={channelAvatarNode}
      channelNameNode={channelNameNode}
      showMeta={showMeta}
      metaNode={metaNode}
      onClick={onClick && handleClick}
      className={className}
    />
  )
}

export default VideoPreview
