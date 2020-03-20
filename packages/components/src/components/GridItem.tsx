import React from "react";

import { css } from "@emotion/core";

type GridElementProps = {
  children?: JSX.Element | JSX.Element[];
  gridColumn?: string | number;
  gridRow?: string | number;
  gridArea?: string;
  justifySelf?: "start" | "end" | "center" | "stretch";
  alignSelf?: "start" | "end" | "center" | "stretch";
  placeSelf?: "string";
};

export default function GridItem({
  children,
  gridColumn = "",
  gridRow = "",
  gridArea = "",
  justifySelf = "start",
  alignSelf = "start",
  placeSelf,
}: GridElementProps) {
  return (
    <div
      css={css`
        grid-column: ${gridColumn};
        grid-row: ${gridRow};
        grid-area: ${gridArea};
        justify-self: ${justifySelf};
        align-self: ${alignSelf};
        place-self: ${placeSelf};
      `}
    >
      {children}
    </div>
  );
}
