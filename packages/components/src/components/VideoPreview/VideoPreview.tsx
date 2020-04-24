import React from "react"

import { makeStyles, VideoPreviewStyleProps } from "./VideoPreview.styles"
import Avatar from "./../Avatar"

type VideoPreviewProps = {
  url: string
  title: string
  channel?: string
  channelUrl?: string
  channelImg?: string
  showChannel?: boolean
  poster?: string
} & VideoPreviewStyleProps

export default function VideoPreview({
  url,
  title,
  channel,
  channelUrl,
  channelImg,
  showChannel = false,
  poster,
  ...styleProps
}: VideoPreviewProps) {
  let styles = makeStyles({ showChannel, ...styleProps })
  return (
    <div css={styles.container}>
      <div css={styles.coverContainer}>
        <a css={styles.link} href={url}>
          <img css={styles.cover} src={poster} />
        </a>
      </div>
      <div css={styles.infoContainer}>
        {showChannel && (
          <a css={styles.link} href={url}>
            <div css={styles.avatar}>
              <Avatar size="small" img={channelImg} />
            </div>
          </a>
        )}
        <div css={styles.textContainer}>
          <a css={styles.link} href={url}>
            <h3 css={styles.title}>{title}</h3>
          </a>
          {showChannel && (
            <a css={styles.channel} href={channelUrl}>
              <h3>{channel}</h3>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
