import React from "react";
import { makeStyles, SectionStyleProps } from "./GenericSection.style";

type SectionProps = {
  children?: React.ReactNode;
  title?: string;
  className?: string;
} & SectionStyleProps;

export default function GenericSection({
  children,
  title,
  className,
  ...styleProps
}: SectionProps) {
  let styles = makeStyles(styleProps);
  return (
    <section css={styles.section} className={className}>
      {title && <h2 css={styles.header}>{title}</h2>}
      {children}
    </section>
  );
}
