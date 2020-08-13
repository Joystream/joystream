import React from 'react'
import {
  AvatarContainer,
  Container,
  CoverContainer,
  InfoContainer,
  MetaContainer,
  TextContainer,
} from './VideoPreviewBase.styles'
import styled from '@emotion/styled'
import Placeholder from '../Placeholder'

type VideoPreviewBaseProps = {
  coverNode?: React.ReactNode
  titleNode?: React.ReactNode
  showChannel?: boolean
  channelAvatarNode?: React.ReactNode
  channelNameNode?: React.ReactNode
  showMeta?: boolean
  metaNode?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  className?: string
}

const VideoPreviewBase: React.FC<VideoPreviewBaseProps> = ({
  coverNode,
  titleNode,
  showChannel = true,
  channelAvatarNode,
  channelNameNode,
  showMeta = true,
  metaNode,
  onClick,
  className,
}) => {
  const clickable = !!onClick

  const coverPlaceholder = <Placeholder />
  const channelAvatarPlaceholder = <Placeholder rounded />
  const titlePlaceholder = <Placeholder height="18px" width="60%" />
  const channelNamePlaceholder = <SpacedPlaceholder height="12px" width="60%" />
  const metaPlaceholder = <SpacedPlaceholder height="12px" width="80%" />

  return (
    <Container onClick={onClick} clickable={clickable} className={className}>
      <CoverContainer>{coverNode || coverPlaceholder}</CoverContainer>
      <InfoContainer>
        {showChannel && <AvatarContainer>{channelAvatarNode || channelAvatarPlaceholder}</AvatarContainer>}
        <TextContainer>
          {titleNode || titlePlaceholder}
          {showChannel && (channelNameNode || channelNamePlaceholder)}
          {showMeta && <MetaContainer>{metaNode || metaPlaceholder}</MetaContainer>}
        </TextContainer>
      </InfoContainer>
    </Container>
  )
}

const SpacedPlaceholder = styled(Placeholder)`
  margin-top: 6px;
`

export default VideoPreviewBase
