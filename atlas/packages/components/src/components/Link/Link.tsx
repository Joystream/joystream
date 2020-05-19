import React, { ReactNode, ReactChild } from "react"
import { Link } from "@reach/router"
import { makeStyles, CustomLinkStyleProps } from "./Link.style"

type CustomLinkProps = {
  children: ReactChild
  to: string
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
} & CustomLinkStyleProps

export default function CustomLink({
  children,
  to = "",
  disabled = false,
  onClick,
  ...styleProps
}: CustomLinkProps) {

  let styles = makeStyles(styleProps)

  if (disabled) return <label css={styles.disabled}>{children}</label>
  return <Link to={to} css={styles.regular}>{children}</Link>
}
