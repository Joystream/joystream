import { css } from "@emotion/core";
import { spacing, typography, colors } from "../../theme";

export type VideoStyleProps = {
  width?: string | number;
  height?: string | number;
  responsive?: boolean;
  ratio?: string;
};

export let makeStyles = ({
  width = "100%",
  height = "100%",
  responsive = true,
  ratio = "16:9",
}: VideoStyleProps) => {
  let ratioPerc = ratio
    .split(":")
    .map(x => Number(x))
    .reduce((x, y) => (y / x) * 100);
  return {
    containerStyles: css`
      position: relative;
      ${responsive ? `padding: ${ratioPerc}%` : ""}
    `,
    playerStyles: css`
        ${
          responsive
            ? css`
                position: absolute;
                top: 0;
                left: 0;
              `
            : ""
        }
      width: ${width};
      height: ${height};

    `,
  };
};
