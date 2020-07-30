import React from 'react'
import {
  ChannelName,
  Container,
  CoverContainer,
  CoverDurationOverlay,
  CoverHoverOverlay,
  CoverImage,
  CoverPlayIcon,
  InfoContainer,
  MetaText,
  ProgressBar,
  ProgressOverlay,
  StyledAvatar,
  TextContainer,
  TitleHeader,
} from './VideoPreview.styles'
import { DateTime, Duration } from 'luxon'
import { formatDateShort, formatDurationShort } from '@/utils/time'
import { formatNumberShort } from '@/utils/number'

type VideoPreviewProps = {
  title: string
  channelName: string
  channelAvatarURL?: string
  createdAt: DateTime
  duration?: Duration
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
  const clickable = !!onClick
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

  return (
    <Container onClick={handleClick} clickable={clickable} className={className}>
      <CoverContainer>
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
      </CoverContainer>
      <InfoContainer>
        {showChannel && (
          <StyledAvatar
            size="small"
            name={channelName}
            img={channelAvatarURL}
            channelClickable={channelClickable}
            onClick={handleChannelClick}
          />
        )}
        <TextContainer>
          <TitleHeader>{title}</TitleHeader>
          {showChannel && (
            <ChannelName channelClickable={channelClickable} onClick={handleChannelClick}>
              {channelName}
            </ChannelName>
          )}
          {showMeta && (
            <MetaText>
              {formatDateShort(createdAt)}・{formatNumberShort(views)} views
            </MetaText>
          )}
        </TextContainer>
      </InfoContainer>
    </Container>
  )
}

export default VideoPreview
