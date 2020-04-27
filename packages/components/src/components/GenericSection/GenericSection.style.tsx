import { css } from "@emotion/core"
import { spacing, typography, colors } from "../../theme"

export type SectionStyleProps = {
  topDivider?: boolean
  bottomDivider?: boolean
}

export let makeStyles = ({
  topDivider = true,
  bottomDivider = false,
}: SectionStyleProps) => {
  return {
    section: css`
      margin: 30px 0;
      border-bottom: ${bottomDivider
        ? `1px solid ${colors.text.base}`
        : "none"};
    `,
    header: css`
      display: grid;
      grid-template: auto / 50% 50%;
      margin-top: ${spacing.s16};
      margin-bottom: ${spacing.s8};
      border-bottom: ${topDivider ? `1px solid ${colors.text.base}` : "none"};
    `,
    title: css`
      margin: 0;
      color: ${colors.text.base};
      font-family: ${typography.fonts.headers};
      font-weight: ${typography.weights.light};
      font-size: ${typography.sizes.large};
      line-height: 3rem;
    `,
    link: css`
      text-align: right;
      margin: 15px 0 0;
      color: ${colors.text.base};
      font-family: ${typography.fonts.headers};
      font-weight: ${typography.weights.regular};
      font-size: ${typography.sizes.normal};
      line-height: 2rem;
      text-transform: uppercase;
      & > div {
        display: inline-block;
        cursor: pointer;
      }
    `
  }
}
