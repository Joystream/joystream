import { css } from "@emotion/core";
import { typography, colors } from "../../theme";

export type ButtonStyleProps = {
  type?: "primary" | "secondary"
  size?: "normal" | "full"
};

export let makeStyles = ({
  type = "primary",
  size = "normal"
}: ButtonStyleProps) => {
  return css`
    border: 1px solid ${colors.blue};
    color: ${colors.white};
    background-color: ${type === "primary" ? colors.blue : colors.black};
    text-align: center;
    padding: 15px 30px;
    display: ${size === "normal" ? "inline-block" : "block"};
    cursor: pointer;
    font-family: ${typography.fonts.base};
    font-weight: ${typography.weights.regular};
  `;
};
