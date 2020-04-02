import React from "react";

import { ChannelSummaryStyleProps, makeStyles } from "./ChannelSummary.style";

import Label from "../Label";
import Avatar from "../Avatar";
import Button from "../Button";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
            <div>
              <Label icon="film">Video Channel</Label>
            </div>
            <div>
              {isPublic && (
                <Button outlined color="success" size="small">
                  <Label icon="eye">Public</Label>
                </Button>
              )}
              {isVerified && (
                <Button outlined color="primary" size="small">
                  <Label icon="check">Verified</Label>
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
