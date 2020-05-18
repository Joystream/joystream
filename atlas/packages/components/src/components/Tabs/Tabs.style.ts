import { css } from "@emotion/core"
import { typography, colors, spacing } from "../../theme"

export type TabsStyleProps = {
}

export let makeStyles = ({
}: TabsStyleProps) => {
  return {
    container: css`
      font-family: ${typography.fonts.base};
      color: ${colors.white};
    `,
    tabs: css`
      display: flex;
    `,
    tab: css`
      flex-basis: content;
      padding: ${spacing.m} ${spacing.l};
      cursor: pointer;
      border: 1px solid white;
    `,
    activeTab: css`
      flex-basis: content;
      padding: ${spacing.m} ${spacing.l};
      cursor: pointer;
      border: 1px solid white;
      color: black;
      background-color: white;
    `
  }
}
