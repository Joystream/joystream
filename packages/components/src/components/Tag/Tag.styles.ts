import { css } from "@emotion/core"
import { typography, colors } from "../../theme"

export type TagStyleProps = {}

export let makeStyles = ({}: TagStyleProps) => {
  return css`
    border: 1px solid ${colors.blue[700]};
    color: ${colors.white};
    background-color: ${colors.black};
    text-align: center;
    padding: 10px 15px;
    display: inline-block;
    cursor: default;
    font-family: ${typography.fonts.base};
    font-weight: ${typography.weights.regular};
    font-size: ${typography.sizes.xsmall};
    margin: 0 15px 0 0;

    &::selection {
      background: transparent;
    }
  `
}
