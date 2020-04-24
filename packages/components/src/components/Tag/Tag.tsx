import React from "react"
import { makeStyles, TagStyleProps } from "./Tag.style"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconProp } from "@fortawesome/fontawesome-svg-core"

type TagProps = {
  icon?: IconProp
  text?: string
} & TagStyleProps

export default function Tag({ icon, text, ...styleProps }: TagProps) {
  let styles = makeStyles(styleProps)
  return (
    <div css={styles.container}>
      {!!icon &&
        <FontAwesomeIcon icon={icon} css={styles.icon} />
      }
      {!!icon && !!text && <span style={{ margin: "0 10px 0 0" }}></span>}
      {!!text &&
        <span>{text}</span>
      }
    </div>
  )
}
