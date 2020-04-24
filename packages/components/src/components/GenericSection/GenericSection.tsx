import React from "react"
import { makeStyles, SectionStyleProps } from "./GenericSection.style"

type SectionProps = {
  children?: React.ReactNode
  title?: string
  link?: string
  linkText?: string
  className?: string
} & SectionStyleProps

export default function GenericSection({
  children,
  title,
  link,
  linkText,
  className,
  ...styleProps
}: SectionProps) {
  let styles = makeStyles(styleProps)
  return (
    <section css={styles.section} className={className}>
      <div css={styles.header}>
        <h2 css={styles.title}>{title}</h2>
        {!!link && !!linkText &&
          <div css={styles.link}>
            <a href={link}>{linkText}</a>
          </div>
        }
      </div>
      {children}
    </section>
  )
}
