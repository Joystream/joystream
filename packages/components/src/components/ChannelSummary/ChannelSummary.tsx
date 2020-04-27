import React from "react"
import { ChannelSummaryStyleProps, makeStyles } from "./ChannelSummary.style"
import Avatar from "../Avatar"
import Tag from "../Tag"
import { faEye, faCheck } from "@fortawesome/free-solid-svg-icons"
import { colors } from "./../../theme"

type ChannelSummaryProps = {
  name: string
  img?: string
  description?: string
  size?: "small" | "default" | "large"
  isPublic?: boolean
  isVerified?: boolean
  onClick?: any
} & ChannelSummaryStyleProps

export default function ChannelSummary({
  isPublic,
  isVerified,
  description,
  size,
  name,
  img,
  onClick,
  ...styleProps
}: ChannelSummaryProps) {
  let styles = makeStyles({ size, ...styleProps })
  return (
    <div css={styles.container}>
      <div css={styles.avatar} onClick={event => { event.stopPropagation(); onClick() }}>
        <Avatar size={size} img={img} />
      </div>
      <div css={styles.details}>
        <h1 css={styles.title} onClick={event => { event.stopPropagation(); onClick() }}>{name}</h1>
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
