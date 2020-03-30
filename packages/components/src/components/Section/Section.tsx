import React from "react";
import { makeStyles, SectionStyleProps } from "./Section.style";

type SectionProps = {
  children?: React.ReactNode;
  title?: string;
} & SectionStyleProps;

export default function Section({
  children,
  title,
  ...styleProps
}: SectionProps) {
  let styles = makeStyles(styleProps);
  return (
    <section css={styles.section}>
      <h2 css={styles.header}>{title}</h2>
      {children}
    </section>
  );
}
