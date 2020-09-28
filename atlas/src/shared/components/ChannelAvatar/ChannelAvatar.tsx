import React from 'react'
import { Container, Name, StyledAvatar } from './ChannelAvatar.style'

type ChannelAvatarProps = {
  name: string
  avatarUrl?: string | null
  className?: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
}

const ChannelAvatar: React.FC<ChannelAvatarProps> = ({ name, avatarUrl, className, onClick }) => {
  return (
    <Container className={className} onClick={onClick}>
      <StyledAvatar name={name} img={avatarUrl} />
      <Name>{name}</Name>
    </Container>
  )
}

export default ChannelAvatar
