import React from "react"
import { makeStyles, SectionStyleProps } from "./GenericSection.style"

type SectionProps = {
  children?: React.ReactNode
  title?: string
  linkText?: string
  className?: string
  onLinkClick?: any
} & SectionStyleProps

export default function GenericSection({
  children,
  title,
  linkText,
  className,
  onLinkClick,
  ...styleProps
}: SectionProps) {
  let styles = makeStyles(styleProps)
  return (
    <section css={styles.section} className={className}>
      <div css={styles.header}>
        <h2 css={styles.title}>{title}</h2>
        {!!linkText &&
          <div css={styles.link}>
            <div onClick={onLinkClick}>
              {linkText}
            </div>
          </div>
        }
      </div>
      {children}
    </section>
  )
}
