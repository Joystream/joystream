import React from "react";

import { ChannelSummaryStyleProps, makeStyles } from "./ChannelSummary.style";

import Banner from "../Banner";
import Avatar from "../Avatar";
import Button from "../Button";

type ChannelSummaryProps = {
  name: string;

  img?: string;
  channelUrl?: string;
  description?: string;
  size?: "small" | "default" | "large";
  isPublic?: boolean;
  isVerified?: boolean;
} & ChannelSummaryStyleProps;

export default function ChannelSummary({
  isPublic,
  isVerified,
  description,
  channelUrl,
  size,
  name,

  img,
  ...styleProps
}: ChannelSummaryProps) {
  let styles = makeStyles(styleProps);
  return (
    <>
      <div css={styles.container}>
        <Avatar link={channelUrl} size={size} img={img} />
        <div css={styles.details}>
          <h1 css={styles.title}>{name}</h1>
          <div css={styles.badges}>
            <div>Video Channel</div>
            <div>
              {isPublic && (
                <Button outlined color="success" size="small">
                  Public
                </Button>
              )}
              {isVerified && (
                <Button outlined color="primary" size="small">
                  Verified
                </Button>
              )}
            </div>
          </div>
          {description && (
            <div>
              <p>{description}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
