import { css } from "@emotion/core"

export type GridStyleProps = {
  minItemWidth?: string
}

export let makeStyles = ({
  minItemWidth = "200px"
}: GridStyleProps) => {
  return {
    container: css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(${minItemWidth}, 1fr));
      gap: 30px;
    `,
    item: css`
      width: 100%;
      cursor: pointer;
    `,
  }
}
