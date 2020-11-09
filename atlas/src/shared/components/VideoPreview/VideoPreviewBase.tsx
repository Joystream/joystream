import React from 'react'
import {
  AvatarContainer,
  Container,
  CoverContainer,
  InfoContainer,
  MetaContainer,
  TextContainer,
  CoverWrapper,
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
  main?: boolean
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
  main = false,
  metaNode,
  onClick,
  className,
}) => {
  const clickable = !!onClick

  const displayChannel = showChannel && !main

  const coverPlaceholder = <CoverPlaceholder />
  const channelAvatarPlaceholder = <Placeholder rounded />
  const titlePlaceholder = <Placeholder height={main ? 45 : 18} width="60%" />
  const channelNamePlaceholder = <SpacedPlaceholder height="12px" width="60%" />
  const metaPlaceholder = <SpacedPlaceholder height={main ? 16 : 12} width={main ? '40%' : '80%'} />

  return (
    <Container onClick={onClick} clickable={clickable} main={main} className={className}>
      <CoverWrapper>
        <CoverContainer>{coverNode || coverPlaceholder}</CoverContainer>
      </CoverWrapper>
      <InfoContainer main={main}>
        {displayChannel && <AvatarContainer>{channelAvatarNode || channelAvatarPlaceholder}</AvatarContainer>}
        <TextContainer>
          {titleNode || titlePlaceholder}
          {displayChannel && (channelNameNode || channelNamePlaceholder)}
          {showMeta && <MetaContainer main={main}>{metaNode || metaPlaceholder}</MetaContainer>}
        </TextContainer>
      </InfoContainer>
    </Container>
  )
}

const SpacedPlaceholder = styled(Placeholder)`
  margin-top: 6px;
`
const CoverPlaceholder = styled(Placeholder)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

export default VideoPreviewBase
