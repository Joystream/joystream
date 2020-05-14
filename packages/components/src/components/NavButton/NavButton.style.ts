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
    background-color: ${type === "primary" ? colors.blue[500] : colors.black};
    text-align: center;
    display: inline-block;
    cursor: default;
    font-family: ${typography.fonts.base};
    font-weight: ${typography.weights.medium};
    font-size: ${typography.sizes.subtitle1};
    margin: 1px;
    padding: 0;
    width: 50px;
    height: 50px;
    line-height: 50px;

    &:hover {
      background-color: ${type === "primary" ? colors.blue[700] : colors.black};
      border-color: ${colors.blue[700]};
      color: ${type === "primary" ? colors.white : colors.blue[300]};
    }

    &:active {
      background-color: ${type === "primary" ? colors.blue[900] : colors.black};
      border-color: ${colors.blue[900]};
      color: ${type === "primary" ? colors.white : colors.blue[700]};
    }

    &::selection {
      background: transparent;
    }
  `
}
