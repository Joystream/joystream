import React from 'react'
import styled from '@emotion/styled'
import { formatNumberShort } from '@/utils/number'
import ChannelPreviewBase from './ChannelPreviewBase'
import { typography } from '../../theme'
import { Avatar } from '..'

type ChannelPreviewProps = {
  name: string
  views: number
  avatarURL?: string | null
  className?: string
  animated?: boolean
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
}

const ChannelPreview: React.FC<ChannelPreviewProps> = ({
  name,
  avatarURL,
  views,
  className,
  animated = false,
  onClick,
}) => {
  const avatarNode = <StyledAvatar img={avatarURL} />
  const nameNode = <NameHeader>{name}</NameHeader>
  const metaNode = <MetaSpan>{formatNumberShort(views)} views</MetaSpan>

  return (
    <ChannelPreviewBase
      className={className}
      avatarNode={avatarNode}
      nameNode={nameNode}
      metaNode={metaNode}
      animated={animated}
      onClick={onClick}
    />
  )
}

const NameHeader = styled.h2`
  margin: 0;
  font-size: ${typography.sizes.h6};
  line-height: 1.25;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`

const MetaSpan = styled.span`
  font-size: ${typography.sizes.subtitle2};
  line-height: 1.43;
`

export const StyledAvatar = styled(Avatar)`
  width: 100%;
  height: 100%;
`

export default ChannelPreview
