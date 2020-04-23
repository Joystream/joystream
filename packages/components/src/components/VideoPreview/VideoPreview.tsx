import React from "react";

import { makeStyles, VideoPreviewStyleProps } from "./VideoPreview.styles";
import Avatar from "./../Avatar";

type VideoPreviewProps = {
  url: string;
  title: string;
  channel?: string;
  channelUrl?: string;
  channelImg?: string;
  showChannel?: boolean;
} & VideoPreviewStyleProps;

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
  let styles = makeStyles(styleProps);
  return (
    <div css={styles.container}>
      <a css={styles.containerLink} href={url}>
        <div css={styles.coverContainer}>
          <img css={styles.cover} src={poster} />
        </div>
        <div css={styles.infoContainer}>
          {showChannel && (
            <div css={styles.avatar}>
              <Avatar size="small" link={channelUrl} img={channelImg} />
            </div>
          )}
          <div css={styles.textContainer}>
            <h3 css={styles.title}>{title}</h3>
            {showChannel && (
              <a css={styles.channel} href={channelUrl}>
                <h3>{channel}</h3>
              </a>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
