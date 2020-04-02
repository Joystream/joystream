import { css } from "@emotion/core";

import { spacing, typography, colors } from "../../theme";

export type ChannelSummaryStyleProps = {};

export let makeStyles = ({}: ChannelSummaryStyleProps) => {
  return {
    container: css`
      display: flex;
      margin: ${spacing.s4} auto;
    `,
    details: css`
      display: flex;
      flex-direction: column;
    `,
    title: css`
      color: ${colors.text.accent};
    `,
    badges: css`
      display: flex;
      justify-content: space-between;
      text-transform: uppercase;

      & > *:first-child {
        margin-right: ${spacing.s4};
      }

      & button {
        margin-right: ${spacing.s2};
      }
    `,
  };
};
