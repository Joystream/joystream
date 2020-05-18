import { css } from "@emotion/core"
import { typography, colors, spacing } from "../../theme"

export type RadioButtonStyleProps = {
  selected?: boolean
  disabled?: boolean
  position?: "end" | "start" | "top" | "bottom"
}

export let makeStyles = ({
  selected = false,
  disabled = false,
  position = "end"
}: RadioButtonStyleProps) => {

  return {
    container: css`
      font-family: ${typography.fonts.base};
      display: ${(position === "bottom" || position === "top") ? "inline-block" : "inline-flex"};
      align-items: center;
      &:focus {
        outline: none;
      }`,
    outterDot: css`
      width: ${spacing.xxl};
      height: ${spacing.xxl};
      border-radius: 50%;
      position: relative;
      ${position === "bottom" ? `margin: 0 auto ${spacing.xs};` :
        position === "top" ? `margin: ${spacing.xs} auto 0;` : ""}
      ${disabled ? "cursor: not-allowed;" : ""}
      &:hover {
        background-color: ${disabled ? "none" : colors.gray[50]};
      }
      &:active {
        background-color: ${disabled ? "none" : colors.gray[100]};
      }
      &:focus {
        background-color: ${disabled ? "none" : colors.blue[100]};
        outline: none;
      }
    `,
    dot: css`
      width: ${spacing.m};
      height: ${spacing.m};
      border: 1px solid ${disabled ? colors.gray[200] : selected ? colors.blue[500] : colors.gray[300]};
      border-radius: 50%;
      ${disabled ? `background-color: ${colors.gray[50]};` : ""}
      ${disabled && selected ?
        `background-image: repeating-radial-gradient(circle, ${colors.gray[200]} 0px, ${colors.gray[200]} 3px, transparent 3px, transparent 6px, ${colors.gray[200]} 6px, ${colors.gray[200]} 8px);` :
        disabled && !selected ? `background-color: ${colors.gray[50]};` :
        selected ?
        `background-image: repeating-radial-gradient(circle, ${colors.blue[500]} 0px, ${colors.blue[500]} 3px, transparent 3px, transparent 6px, ${colors.blue[500]} 6px, ${colors.blue[500]} 8px);` : ""}
      position: absolute;
      top: 7px;
      left: 7px;
      &:focus,
      &:active {
        border-color: ${disabled ? colors.gray[200] : colors.gray[700]};
      }
    `,
    label: css`
      color: ${colors.white};
      ${position === "end" ? `margin-left: ${spacing.xs};` :
        position === "start" ? `margin-right: ${spacing.xs};` :
        position === "bottom" ? `margin: 0 auto ${spacing.xs};` :
        position === "top" ? `margin: ${spacing.xs} auto 0;` : ""}
    `
  }
}
