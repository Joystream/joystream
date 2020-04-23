import { css } from "@emotion/core";
import { spacing, colors } from "../../theme";

export type ChannelSummaryStyleProps = {};

export let makeStyles = ({}: ChannelSummaryStyleProps) => {
  return {
    container: css`
      display: flex;
      margin: ${spacing.s4} auto;
      & > a {
        text-decoration: none;
      }
    `,
    details: css`
      display: flex;
      flex-direction: column;
      margin: 0 0 0 ${spacing.s4};
    `,
    title: css`
      color: ${colors.text.accent};
      margin: ${spacing.s3} 0;
    `,
    badges: css`
      display: flex;
      justify-content: space-between;
      text-transform: uppercase;
      & > *:not(last-child) {
        margin-right: ${spacing.s2};
      }
    `,
    tagSuccess: css`
      color: ${colors.other.success}
    `,
    tagInfo: css`
      color: ${colors.other.info}
    `
  };
};
