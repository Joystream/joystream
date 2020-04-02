import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

export type BannerStyleProps = {
  src: string;
};

export let makeStyles = ({ src }: BannerStyleProps) => {
  return css`
    background-image: url(${src});
    background-size: cover;
    background-position: center;
    width: 100%;
    min-height: ${spacing.s25};
  `;
};
