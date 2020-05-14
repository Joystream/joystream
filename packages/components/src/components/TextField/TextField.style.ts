import { css } from "@emotion/core"
import { typography, colors } from "./../../theme"

export type TextFieldStyleProps = {
  disabled?: boolean
}

export let makeStyles = ({
  disabled = false
}: TextFieldStyleProps) => {

  return {
    container: css`
      position: relative;
      min-width: 250px;
      height: 50px;
      font-family: ${typography.fonts.base};
      display: inline-flex;
    `,
    border: css`
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid ${colors.gray[400]};
      display: flex;
      align-items: center;
      justify-content: left;
    `,
    label: css`
      color: ${colors.gray[400]};
      padding: 0 10px;
      background-color: ${colors.black};
      transition: all 0.1s linear;
    `,
    input: css`
      display: none;
      width: 100%;
      margin: 0 10px;
      background: none;
      border: none;
      color: ${colors.white};
      outline: none;
    `
  }
}
