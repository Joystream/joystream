import React, { useState } from 'react'
import useResizeObserver from 'use-resize-observer'

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
import { formatDurationShort } from '@/utils/time'
import VideoPreviewBase from './VideoPreviewBase'
import { formatVideoViewsAndDate } from '@/utils/video'

type VideoPreviewProps = {
  title: string
  channelName: string
  channelAvatarURL?: string | null
  createdAt: Date
  duration?: number
  // video watch progress in percent (0-100)
  progress?: number
  views: number | null
  posterURL: string

  showChannel?: boolean
  showMeta?: boolean
  main?: boolean

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
  main = false,
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

  const MIN_COVER_WIDTH = 300
  const MAX_COVER_WIDTH = 600
  const MIN_SCALING_FACTOR = 1
  const MAX_SCALING_FACTOR = 1.375
  // Linear Interpolation, see https://en.wikipedia.org/wiki/Linear_interpolation
  const calculateScalingFactor = (coverWidth: number) =>
    MIN_SCALING_FACTOR +
    ((coverWidth - MIN_COVER_WIDTH) * (MAX_SCALING_FACTOR - MIN_SCALING_FACTOR)) / (MAX_COVER_WIDTH - MIN_COVER_WIDTH)

  const [scalingFactor, setScalingFactor] = useState(MIN_SCALING_FACTOR)
  const { ref: imgRef } = useResizeObserver<HTMLImageElement>({
    onResize: (size) => {
      const { width: coverWidth } = size
      if (coverWidth && !main) {
        setScalingFactor(calculateScalingFactor(coverWidth))
      }
    },
  })

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

  const titleNode = (
    <TitleHeader main={main} scalingFactor={scalingFactor}>
      {title}
    </TitleHeader>
  )

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
    <ChannelName channelClickable={channelClickable} onClick={handleChannelClick} scalingFactor={scalingFactor}>
      {channelName}
    </ChannelName>
  )

  const metaNode = (
    <MetaText main={main} scalingFactor={scalingFactor}>
      {formatVideoViewsAndDate(views, createdAt, { fullViews: main })}
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
      main={main}
      metaNode={metaNode}
      onClick={onClick && handleClick}
      className={className}
      scalingFactor={scalingFactor}
    />
  )
}

export default VideoPreview
