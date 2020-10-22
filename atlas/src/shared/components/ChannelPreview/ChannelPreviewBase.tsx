import React from 'react'
import { AvatarContainer, Info, InnerContainer, OuterContainer } from './ChannelPreviewBase.style'
import Placeholder from '../Placeholder'

type ChannelPreviewBaseProps = {
  avatarNode?: React.ReactNode
  nameNode?: React.ReactNode
  className?: string
  animated?: boolean
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
}

const ChannelPreviewBase: React.FC<ChannelPreviewBaseProps> = ({
  avatarNode,
  nameNode,
  className,
  animated = false,
  onClick,
}) => {
  const avatarPlaceholder = <Placeholder rounded />
  const namePlaceholder = <Placeholder width="140px" height="16px" />

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!onClick) return

    onClick(e)
  }

  return (
    <OuterContainer className={className} onClick={handleClick}>
      <InnerContainer animated={animated}>
        <AvatarContainer>{avatarNode || avatarPlaceholder}</AvatarContainer>
        <Info>{nameNode || namePlaceholder}</Info>
      </InnerContainer>
    </OuterContainer>
  )
}

export default ChannelPreviewBase
