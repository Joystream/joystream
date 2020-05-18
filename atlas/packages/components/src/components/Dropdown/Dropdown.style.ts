import { css } from "@emotion/core"
import { typography, colors, spacing } from "./../../theme"

export type DropdownStyleProps = {
  disabled?: boolean
  focus?: boolean
  error?: boolean
  isActive?: boolean
}

export let makeStyles = ({
  disabled = false,
  focus = false,
  error = false,
  isActive = false,
}: DropdownStyleProps) => {

  const fieldWidth = "250px"

  const borderColor = disabled ? colors.gray[200] :
    error ? colors.error :
    focus ? colors.blue[500] :
    isActive ? colors.gray[200] : colors.gray[400]

  return {
    wrapper: css`
      display: block;
      max-width: ${fieldWidth};
      font-family: ${typography.fonts.base};
    `,
    container: css`
      position: relative;
      width: 100%;
      height: 48px;
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
      padding: 0 ${spacing.xxxxl} 0 ${spacing.s};
      background-color: ${colors.black};
      font-size: ${typography.sizes.body2};
      &::selection {
        background-color: transparent;
      }
    `,
    input: css`
      display: none;
      width: 100%;
      margin: 0 ${spacing.xxxxl} 0 ${spacing.s};
      background: none;
      border: none;
      color: ${colors.white};
      outline: none;
      font-size: ${typography.sizes.body2};
      padding: 5px 0;
    `,
    iconOpen: css`
      color: ${colors.gray[300]};
      font-size: ${typography.sizes.icon.medium};
      position: absolute;
      top: ${spacing.m};
      right: ${spacing.s};
    `,
    iconClose: css`
      color: ${colors.blue[500]};
      font-size: ${typography.sizes.icon.medium};
      position: absolute;
      top: ${spacing.m};
      right: ${spacing.s};
    `,
    helper: css`
      color: ${error ? colors.error : colors.gray[400]};
      font-size: ${typography.sizes.caption};
      margin: ${spacing.xxs} ${spacing.xs};
    `,
    options: css`
      background-color: ${colors.gray[700]};
      color: ${colors.white};
      display: block;
      width: 100%;
      position: absolute;
      top: 50px;
      max-height: 145px;
      overflow-x: none;
      overflow-y: auto;
    `,
    option: css`
      padding: ${spacing.s};
      font-size: ${typography.sizes.body2};
      &:hover {
        background-color: ${colors.gray[600]}
      }
    `
  }
}
