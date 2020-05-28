import { css } from "@emotion/core"
import { typography, colors } from "../../theme"

export type CustomLinkStyleProps = {}

export let makeStyles = ({}: CustomLinkStyleProps) => {

  return {
    regular: css`
      font-family: ${typography.fonts.base};
      font-size: ${typography.sizes.overhead};
      color: ${colors.blue[400]};
      text-decoration: none;
      cursor: pointer;
    `,
    disabled: css`
      font-family: ${typography.fonts.base};
      font-size: ${typography.sizes.overhead};
      color: ${colors.gray[200]};
      text-decoration: none;
      cursor: not-allowed;
    `
  }
}
