import React from "react"
import { makeStyles, TagButtonStyleProps } from "./TagButton.styles"

type TagButtonProps = {
  text: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
} & TagButtonStyleProps

export default function TagButton({
  text,
  onClick,
  ...styleProps
}: TagButtonProps) {
  let styles = makeStyles(styleProps)
  return (
    <div css={styles} onClick={onClick}>
      {text}<span>+</span>
    </div>
  )
}
