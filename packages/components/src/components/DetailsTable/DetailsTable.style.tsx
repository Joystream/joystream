import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

export type DetailsTableStyleProps = {};

export let makeStyles = ({}: DetailsTableStyleProps) => {
  return {
    table: css`
      text-align: left;
      border-collapse: separate;
      border-spacing: 0;
      text-transform: capitalize;
    `,
    row: css`
      td {
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
    `,
    key: css`
      font-weight: ${typography.weights.bold};
      padding: ${spacing.s2} ${spacing.s3};
      width: 25%;
      color: #999;
    `,
    value: css`
      padding: ${spacing.s2} ${spacing.s3};
    `,
  };
};
