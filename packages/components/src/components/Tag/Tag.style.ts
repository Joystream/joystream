import { css } from "@emotion/core"
import { spacing, typography, colors } from "./../../theme"

export type TagStyleProps = {
  color?: string
}

export let makeStyles = ({
  color = colors.grey.base
}: TagStyleProps) => {
  return {
    container: css`
      border: 1px solid ${color};
      border-radius: 4px;
      padding: 5px 10px;
      color: ${color};
      & > span {
        margin-left: 5px;
      }
    `,
    icon: css`
      & > *:nth-child(1) {
        color: inherit;
        flex-shrink: 0;
      }
    `,
  }
}
