import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

export type VideoPreviewStyleProps = {
  poster?: string;
};

export let makeStyles = ({ poster }: VideoPreviewStyleProps) => {
  let px210 = `${parseInt(spacing.s25) * 2.1}rem`;
  let px120 = `${parseInt(spacing.s25) * 1.2}rem`;
  return {
    container: css`
      padding-bottom: ${spacing.s4};
      padding-right: ${spacing.s4};
    `,
    cover: css`
      background-image: ${poster
        ? `url(${poster})`
        : `radial-gradient(${colors.bg.primary}, ${colors.bg.primary})`};
      background-size: cover;
      background-position: center;
      min-width: ${px210};
      min-height: ${px120};
      max-width: ${px210};
      max-height: ${px120};
    `,
    title: css`
      margin: ${spacing.s2} 0;
      font-weight: ${typography.weights.bold};
      text-transform: capitalize;
    `,
    channel: css`
      display: flex;
    `,
    channelTitle: css`
      margin: ${spacing.s2} 0;
    `,
  };
};
