import React from "react"
import { makeStyles, ButtonStyleProps } from "./Button.styles"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

type ButtonProps = {
  text?: string
  icon?: IconProp
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
} & ButtonStyleProps

export default function Button({
  text = "",
  icon,
  disabled = false,
  onClick,
  ...styleProps
}: ButtonProps) {
  let styles = makeStyles({text, disabled, ...styleProps})
  return (
    <div css={styles.container} onClick={disabled ? null : onClick}>
      {!!icon &&
        <FontAwesomeIcon icon={icon} css={styles.icon} />
      }
      {text}
    </div>
  )
}
