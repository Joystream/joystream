import React from "react"
import { ChannelSummaryStyleProps, makeStyles } from "./ChannelSummary.style"
import Avatar from "../Avatar"
import Tag from "../Tag"
import { faEye, faCheck } from "@fortawesome/free-solid-svg-icons"
import { colors } from "./../../theme"

type ChannelSummaryProps = {
  name: string
  img?: string
  channelUrl?: string
  description?: string
  size?: "small" | "default" | "large"
  isPublic?: boolean
  isVerified?: boolean
} & ChannelSummaryStyleProps

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
  let styles = makeStyles(styleProps)
  return (
    <div css={styles.container}>
      <div css={styles.avatar}>
        <a href={channelUrl}>
          <Avatar size={size} img={img} />
        </a>
      </div>
      <div css={styles.details}>
        <a href={channelUrl}>
          <h1 css={styles.title}>{name}</h1>
        </a>
        <div css={styles.badges}>
          {isVerified && (
            <Tag icon={faCheck} text="Verified" color={colors.other.success} />
          )}
          {isPublic && (
            <Tag icon={faEye} text="Public" color={colors.other.info} />
          )}
        </div>
        {description && (
          <div>
            <p>{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
