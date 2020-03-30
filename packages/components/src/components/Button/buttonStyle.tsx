import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";
import * as fragments from "../../theme/fragments";

export type ButtonStyleProps = {
  color?: "primary" | "danger" | "success" | "neutral";
  size?: "normal" | "large" | "small" | "full";
  outlined?: boolean;
};

export let makeStyles = ({
  color = "primary",
  size = "normal",
  outlined = false,
}: ButtonStyleProps) => {
  return css`
    ${fragments.withSize(size)}
    border-radius: ${spacing.s1};
    border-color: ${outlined ? colors.bg[color] : ""};
    border-style: solid;
    border-width: ${size === "small" ? 1 : 2}px;
    font-style: ${typography.fonts.base};
    background-color: ${outlined ? colors.text.white : colors.bg[color]};
    color: ${outlined ? colors.bg[color] : colors.text.white};
  `;
};
