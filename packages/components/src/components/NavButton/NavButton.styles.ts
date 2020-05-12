import { css } from "@emotion/core"
import { typography, colors } from "../../theme"

export type NavButtonStyleProps = {
  type?: "primary" | "secondary"
}

export let makeStyles = ({
  type = "primary"
}: NavButtonStyleProps) => {
  return css`
    border: 0;
    color: ${colors.white};
    background-color: ${type === "primary" ? colors.blue.regular : colors.black.regular};
    text-align: center;
    display: inline-block;
    cursor: default;
    font-family: ${typography.fonts.base};
    font-weight: ${typography.weights.medium};
    font-size: ${typography.sizes.small};
    margin: 1px;
    padding: 0;
    width: 50px;
    height: 50px;
    line-height: 50px;

    &:hover {
      background-color: ${type === "primary" ? colors.blue.hover : colors.black.hover};
    }

    &:active {
      background-color: ${type === "primary" ? colors.blue.regular : colors.black.regular};
    }

    &::selection {
      background: transparent;
    }
  `
}
