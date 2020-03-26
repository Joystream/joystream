import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

export type SearchBarStyleProps = {
  size?: "normal" | "large" | "small" | "full";
  color?: "neutral" | "danger" | "success";
};

export let makeStyles = ({
  color = "neutral",
  size = "normal",
}: SearchBarStyleProps) => {
  return {
    containerStyle: css`
      display: flex;
      padding: ${spacing.s6};
      margin: ${spacing.s4};
      border-radius: ${spacing.s2};
      border: none;

      & * {
        font-size: ${size === "large"
          ? typography.sizes.large
          : size === "normal"
          ? typography.sizes.normal
          : typography.sizes.small};
      }
    `,
    inputStyle: css`
      padding: ${size === "large"
        ? `${spacing.s4} ${spacing.s2}`
        : size === "normal" || size === "full"
        ? `${spacing.s3} ${spacing.s2}`
        : `${spacing.s2} ${spacing.s1}`};
      font-weight: ${typography.weights.light};
      border-radius: ${spacing.s1};
      border: 1px solid ${colors.bg[color]};
    `,
  };
};
