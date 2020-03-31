import React from "react";

import { makeStyles, LabelStyleProps } from "./Label.style";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

type LabelProps = {
  children?: string;
  icon?: IconProp;
} & LabelStyleProps;

export default function Label({ children, icon, ...styleProps }: LabelProps) {
  let styles = makeStyles(styleProps);
  return (
    <div css={styles.container}>
      <FontAwesomeIcon icon={icon} css={styles.icon} />
      <span>{children}</span>
    </div>
  );
}
