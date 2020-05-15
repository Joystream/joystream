import { css } from "@emotion/core"
import { typography, colors, spacing } from "./../../theme"
import { icon } from "@fortawesome/fontawesome-svg-core"

export type TextFieldStyleProps = {
  disabled?: boolean
  focus?: boolean
  error?: boolean
  isActive?: boolean
  iconPosition?: "right" | "left"
}

export let makeStyles = ({
  disabled = false,
  focus = false,
  error = false,
  isActive = false,
  iconPosition = "right"
}: TextFieldStyleProps) => {

  const borderColor = disabled ? colors.gray[200] :
    error ? colors.error :
    focus ? colors.blue[500] :
    isActive ? colors.gray[200] : colors.gray[400]

  return {
    wrapper: css`
      display: block;
      font-family: ${typography.fonts.base};
    `,
    container: css`
      position: relative;
      min-width: 250px;
      height: 50px;
      display: inline-flex;
      cursor: ${disabled ? "not-allowed" : "default"};
    `,
    border: css`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid ${borderColor};
      display: flex;
      align-items: center;
      justify-content: left;
    `,
    label: css`
      color: ${error ? colors.error : colors.gray[400]};
      padding: 0 ${spacing.s};
      ${icon ? `padding-${iconPosition}: ${spacing.xxxxl};` : ""}
      background-color: ${colors.black};
      transition: all 0.1s linear;
    `,
    input: css`
      display: none;
      width: 100%;
      margin: 0 ${spacing.s};
      ${icon ? `margin-${iconPosition}: ${spacing.xxxxl};` : ""}
      background: none;
      border: none;
      color: ${colors.white};
      outline: none;
    `,
    icon: css`
      color: ${colors.gray[300]};
      font-size: ${typography.sizes.icon.xlarge};
      position: absolute;
      top: ${spacing.s};
      ${iconPosition}: ${spacing.s};
    `,
    helper: css`
      color: ${error ? colors.error : colors.gray[400]};
      font-size: ${typography.sizes.caption};
      margin: ${spacing.xxs} ${spacing.xs};
    `
  }
}
