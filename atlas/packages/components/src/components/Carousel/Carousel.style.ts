import { css } from "@emotion/core"

export type CarouselStyleProps = {
  navTopPosition?: string
}

export let makeStyles = ({
  navTopPosition = "0"
}: CarouselStyleProps) => {
  return {
    wrapper: css`
      position: relative;
    `,
    container: css`
      display: flex;
      width: 100%;
      overflow: hidden;
    `,
    item: css`
      display: inline-block;
    `,
    navLeft: css`
      position: absolute;
      left: 0;
      top: ${navTopPosition};
    `,
    navRight: css`
      position: absolute;
      right: 0;
      top: ${navTopPosition};
    `
  }
}
