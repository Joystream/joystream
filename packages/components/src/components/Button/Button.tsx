import React from "react"
import { makeStyles, ButtonStyleProps } from "./Button.styles"

type ButtonProps = {
  children?: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
} & ButtonStyleProps

export default function Button({
  children,
  onClick,
  ...styleProps
}: ButtonProps) {
  let styles = makeStyles(styleProps)
  return (
    <div css={styles} onClick={onClick}>
      {children}
    </div>
  )
}
