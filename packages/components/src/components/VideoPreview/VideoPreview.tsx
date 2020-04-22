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
      <a href={url}>
        <div css={styles.coverContainer}>
          <img css={styles.cover} src={poster} />
        </div>
      </a>
      <div>
        <a href={url}>
          <h3 css={styles.title}>{title}</h3>
        </a>
        {showChannel && (
          <div css={styles.channel}>
            <Avatar size="small" link={channelUrl} img={channelImg} />
            <a href={channelUrl}>
              <h3 css={styles.channelTitle}>{channel}</h3>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
