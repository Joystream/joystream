import React from 'react'
import { SerializedStyles } from '@emotion/core'
import { useCSS } from './ChannelPreview.style'
import Avatar from '../Avatar'
import { formatNumberShort } from '@/utils/number'

type ChannelPreviewProps = {
  name: string
  views: number
  avatarURL?: string
  outerContainerCss?: SerializedStyles
}

export default function ChannelPreview({ name, avatarURL, views, outerContainerCss }: ChannelPreviewProps) {
  const styles = useCSS({})
  return (
    <article css={[styles.outerContainer, outerContainerCss]}>
      <div css={styles.innerContainer}>
        <Avatar outerStyles={styles.avatar} img={avatarURL} />
        <div css={styles.info}>
          <h2>{name}</h2>
          <span>{formatNumberShort(views)} views</span>
        </div>
      </div>
    </article>
  )
}
