import { css } from "@emotion/core";
import spacing from "./spacing";
import typography from "./typography";

export function withSize(size: string) {
  return css`
    padding: ${size === "large"
      ? `${spacing.s4} ${spacing.s2}`
      : size === "normal" || size === "full"
      ? `${spacing.s3} ${spacing.s2}`
      : `${spacing.s2} ${spacing.s1}`};

    font-size: ${size === "large"
      ? typography.sizes.large
      : size === "normal" || size === "full"
      ? typography.sizes.normal
      : typography.sizes.small};

    width: ${size === "full" ? "100%" : "auto"};
  `;
}
