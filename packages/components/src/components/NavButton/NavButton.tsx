import React from "react"
import { makeStyles, NavButtonStyleProps } from "./NavButton.style"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons"

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
      {direction === "right" ? <FontAwesomeIcon icon={faChevronRight} /> : <FontAwesomeIcon icon={faChevronLeft} />}
    </div>
  )
}
