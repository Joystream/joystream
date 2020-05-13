import { css } from "@emotion/core"
import { typography, colors } from "../../theme"

export type TagButtonStyleProps = {
  selected?: boolean
}

export let makeStyles = ({
  selected = false
}: TagButtonStyleProps) => {
  return css`
    border: 1px solid ${colors.blue[500]};
    color: ${colors.white};
    background-color: ${colors.black};
    text-align: center;
    padding: 15px 20px;
    display: inline-block;
    cursor: default;
    font-family: ${typography.fonts.base};
    font-weight: ${typography.weights.medium};
    font-size: ${typography.sizes.button.large};
    margin: 0 15px 0 0;
    line-height: ${typography.sizes.button.large};
    box-shadow: ${selected ? `3px 3px ${colors.blue[500]}` : "none"};

    span {
      margin-left: 20px;
      font-size: ${typography.sizes.icon.xxlarge};
      font-weight: ${typography.weights.regular};
      line-height: 0;
      vertical-align: sub;
    }

    &::selection {
      background: transparent;
    }
  `
}
