import { css } from "@emotion/core"
import { typography, colors } from "../../theme"

export type TagButtonStyleProps = {
  selected?: boolean
}

export let makeStyles = ({
  selected = false
}: TagButtonStyleProps) => {
  return css`
    border: 1px solid ${colors.blue.regular};
    color: ${colors.white};
    background-color: ${colors.black.regular};
    text-align: center;
    padding: 15px 20px;
    display: inline-block;
    cursor: default;
    font-family: ${typography.fonts.base};
    font-weight: ${typography.weights.medium};
    font-size: ${typography.sizes.small};
    margin: 0 15px 0 0;
    line-height: ${typography.sizes.normal};
    box-shadow: ${selected ? `3px 3px ${colors.blue.regular}` : "none"};

    span {
      margin-left: 20px;
      font-size: ${typography.sizes.medium};
      font-weight: ${typography.weights.regular};
      line-height: 0;
      vertical-align: sub;
    }

    &:hover {
      background-color: ${colors.black.hover};
    }

    &:active {
      background-color: ${colors.black.regular};
    }

    &::selection {
      background: transparent;
    }
  `
}
