import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";
import { type } from "os";

export type SectionStyleProps = {
  auto?: boolean;
  topDivider?: boolean;
  bottomDivider?: boolean;
};

export let makeStyles = ({
  auto = true,
  topDivider = true,
  bottomDivider = false,
}: SectionStyleProps) => {
  return {
    section: css`
      margin: ${auto ? `${spacing.s4} auto` : `${spacing.s4} 0`};
      border-bottom: ${bottomDivider
        ? `1px solid ${colors.text.base}`
        : "none"};
    `,
    header: css`
      border-bottom: ${topDivider ? `1px solid ${colors.text.base}` : "none"};
      color: ${colors.text.base};
      margin-top: ${spacing.s16};
      margin-bottom: ${spacing.s8};
      padding-bottom: ${spacing.s2};
      font-family: ${typography.fonts.headers};
      font-weight: ${typography.weights.light};
      font-size: ${typography.sizes.large};
    `,
  };
};
