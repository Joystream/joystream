import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

export type AvatarStyleProps = {
  img?: string;
  size?: "small" | "default";
};

export let makeStyles = ({ img, size = "default" }: AvatarStyleProps) => {
  let width =
    size === "small" ? spacing.s10 : `${parseInt(spacing.s10) * 2}rem`;

  let margin = size === "small" ? spacing.s2 : spacing.s4;
  return css`
    background-image: ${img
      ? `url(${img})`
      : `radial-gradient(${colors.bg.primary}, ${colors.bg.primary})`};
    background-size: cover;
    background-position: center;
    border-radius: 50%;
    min-width: ${width};
    min-height: ${width};
    max-width: ${width};
    max-height: ${width};
    margin: auto ${margin};
  `;
};
