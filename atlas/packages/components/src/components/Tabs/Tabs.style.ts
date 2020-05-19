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
      border-bottom: 3px solid ${colors.gray[900]};
      min-width: 100px;
      color: ${colors.gray[200]};
      text-align: center;
    `,
    activeTab: css`
      flex-basis: content;
      padding: ${spacing.m} ${spacing.l};
      cursor: pointer;
      color: ${colors.white};
      background-color: transparent;
      border-bottom: 3px solid ${colors.blue[500]};
      min-width: 100px;
      text-align: center;
    `
  }
}
