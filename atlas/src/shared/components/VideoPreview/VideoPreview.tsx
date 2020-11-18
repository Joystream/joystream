import React, { useState, useLayoutEffect } from 'react'
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

export const MIN_VIDEO_PREVIEW_WIDTH = 300
const MAX_VIDEO_PREVIEW_WIDTH = 600
const MIN_SCALING_FACTOR = 1
const MAX_SCALING_FACTOR = 1.375
// Linear Interpolation, see https://en.wikipedia.org/wiki/Linear_interpolation
const calculateScalingFactor = (videoPreviewWidth: number) =>
  MIN_SCALING_FACTOR +
  ((videoPreviewWidth - MIN_VIDEO_PREVIEW_WIDTH) * (MAX_SCALING_FACTOR - MIN_SCALING_FACTOR)) /
    (MAX_VIDEO_PREVIEW_WIDTH - MIN_VIDEO_PREVIEW_WIDTH)

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
  imgRef?: ((instance: HTMLImageElement | null) => void) | React.MutableRefObject<HTMLImageElement | null | undefined>
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
  imgRef: externalImgRef,
}) => {
  const [scalingFactor, setScalingFactor] = useState(MIN_SCALING_FACTOR)
  const { ref: imgRef } = useResizeObserver<HTMLImageElement>({
    onResize: (size) => {
      const { width: videoPreviewWidth } = size
      if (videoPreviewWidth && !main) {
        setScalingFactor(calculateScalingFactor(videoPreviewWidth))
      }
    },
  })

  useLayoutEffect(() => {
    if (externalImgRef) {
      if (typeof externalImgRef === 'function') {
        externalImgRef(imgRef.current)
        return
      }

      externalImgRef.current = imgRef.current
    }
  })

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

  const titleNode = (
    <TitleHeader main={main} scalingFactor={scalingFactor} onClick={onClick} clickable={Boolean(onClick)}>
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
