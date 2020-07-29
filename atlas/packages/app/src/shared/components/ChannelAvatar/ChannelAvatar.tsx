import React from 'react'
import { Container, Name, StyledAvatar } from './ChannelAvatar.style'

type ChannelAvatarProps = {
  name: string
  avatarUrl?: string
  className?: string
}

const ChannelAvatar: React.FC<ChannelAvatarProps> = ({ name, avatarUrl, className }) => {
  return (
    <Container className={className}>
      <StyledAvatar name={name} img={avatarUrl} />
      <Name>{name}</Name>
    </Container>
  )
}

export default ChannelAvatar
