import { css } from "@emotion/core"

export type GridStyleProps = {
  minItemWidth?: string | number
}

export let makeStyles = ({
  minItemWidth = "200"
}: GridStyleProps) => {
  return {
    container: css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(${minItemWidth}px, 1fr));
      gap: 30px;
    `,
    item: css`
      width: 100%;
      cursor: pointer;
    `,
  }
}
