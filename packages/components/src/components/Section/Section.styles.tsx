import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

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
      border: ${topDivider ? `1px solid ${colors.text.base}` : "none"};
      color: ${colors.text.base};
      margin-bottom: ${spacing.s4};
      font-family: ${typography.fonts.headers};
    `,
  };
};
