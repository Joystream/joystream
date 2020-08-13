import React from 'react'
import styled from '@emotion/styled'
import Avatar from '../Avatar'
import { formatNumberShort } from '@/utils/number'
import ChannelPreviewBase from './ChannelPreviewBase'
import { typography } from '../../theme'

type ChannelPreviewProps = {
  name: string
  views: number
  avatarURL?: string
  className?: string
}

const ChannelPreview: React.FC<ChannelPreviewProps> = ({ name, avatarURL, views, className }) => {
  const avatarNode = <Avatar img={avatarURL} />
  const nameNode = <NameHeader>{name}</NameHeader>
  const metaNode = <MetaSpan>{formatNumberShort(views)} views</MetaSpan>

  return <ChannelPreviewBase className={className} avatarNode={avatarNode} nameNode={nameNode} metaNode={metaNode} />
}

const NameHeader = styled.h2`
  margin: 0;
  font-size: ${typography.sizes.h6};
`

const MetaSpan = styled.span`
  font-size: ${typography.sizes.subtitle2};
  line-height: 1.43;
`

export default ChannelPreview
