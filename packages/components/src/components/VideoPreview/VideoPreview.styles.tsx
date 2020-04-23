import { css } from "@emotion/core"
import { spacing, typography } from "./../../theme"

export type VideoPreviewStyleProps = {
  poster?: string
}

export let makeStyles = ({ poster }: VideoPreviewStyleProps) => {
  return {
    container: css`
    `,
    coverContainer: css`
      width: 100%;
      background-color: black;
    `,
    cover: css`
      display: block;
      width: 100%;
      height: auto;
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
  }
}
