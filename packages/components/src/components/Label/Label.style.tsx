import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

export type LabelStyleProps = {};

export let makeStyles = ({}: LabelStyleProps) => {
  return {
    container: css`
      display: flex;
      justify-content: center;

      & > *:nth-child(2) {
        margin-left: ${spacing.s2};
      }
    `,
    icon: css`
      & > *:nth-child(1) {
        color: inherit;
        flex-shrink: 0;
      }
    `,
  };
};
