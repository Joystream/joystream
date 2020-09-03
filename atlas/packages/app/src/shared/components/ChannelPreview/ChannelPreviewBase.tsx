import React from 'react'
import styled from '@emotion/styled'
import { AvatarContainer, Info, InnerContainer, OuterContainer } from './ChannelPreviewBase.style'
import Placeholder from '../Placeholder'

type ChannelPreviewBaseProps = {
  avatarNode?: React.ReactNode
  nameNode?: React.ReactNode
  metaNode?: React.ReactNode
  className?: string
  animated?: boolean
}

const ChannelPreviewBase: React.FC<ChannelPreviewBaseProps> = ({
  avatarNode,
  nameNode,
  metaNode,
  className,
  animated = false,
}) => {
  const avatarPlaceholder = <Placeholder rounded />
  const namePlaceholder = <Placeholder width="140px" height="16px" />
  const metaPlaceholder = <MetaPlaceholder width="80px" height="12px" />

  return (
    <OuterContainer className={className}>
      <InnerContainer animated={animated}>
        <AvatarContainer>{avatarNode || avatarPlaceholder}</AvatarContainer>
        <Info>
          {nameNode || namePlaceholder}
          {metaNode || metaPlaceholder}
        </Info>
      </InnerContainer>
    </OuterContainer>
  )
}

const MetaPlaceholder = styled(Placeholder)`
  margin-top: 6px;
`

export default ChannelPreviewBase
