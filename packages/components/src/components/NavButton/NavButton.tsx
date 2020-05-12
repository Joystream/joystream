import React from "react"
import { makeStyles, NavButtonStyleProps } from "./NavButton.styles"

type NavButtonProps = {
  direction?: "right" | "left",
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
} & NavButtonStyleProps

export default function NavButton({
  direction = "right",
  onClick,
  ...styleProps
}: NavButtonProps) {
  let styles = makeStyles(styleProps)
  return (
    <div css={styles} onClick={onClick}>
      {direction === "right" ? ">" : "<"}
    </div>
  )
}
