import React from "react";

import { css } from "@emotion/core";

type GridProps = {
  children: JSX.Element[];
  inline?: boolean;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridTemplateAreas?: string;
  gridTemplate?: string;
  gridColumnGap?: string;
  gridRowGap?: string;
  gridGap?: string;
  justifyItems?: "start" | "end" | "center" | "stretch";
  alignItems?: "start" | "end" | "center" | "stretch";
  placeItems?: string;
  justifyContent?:
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "space-around"
    | "space-between"
    | "space-evenly";
  alignContent?:
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "space-around"
    | "space-between"
    | "space-evenly";
  gridAutoRows?: string;
  gridAutoColumns?: string;
  gridAutoFlow?: string;
};

export default function Grid({
  children,
  inline = false,
  gridTemplateColumns,
  gridTemplateRows,
  gridTemplateAreas,
  gridTemplate,
  gridColumnGap,
  gridRowGap,
  gridGap,
  justifyItems,
  alignItems,
  placeItems,
  justifyContent,
  alignContent,
  gridAutoColumns,
  gridAutoRows,
  gridAutoFlow,
}: GridProps) {
  return (
    <div
      css={css`
        display: ${inline ? "inline-grid" : "grid"};
        grid-template-columns: ${gridTemplateColumns};
        grid-template-rows: ${gridTemplateRows};
        grid-template-areas: ${gridTemplateAreas};
        grid-template: ${gridTemplate};
        grid-column-gap: ${gridColumnGap};
        grid-row-gap: ${gridRowGap};
        grid-gap: ${gridGap};
        justify-items: ${justifyItems};
        align-items: ${alignItems};
        place-items: ${placeItems};
        justify-content: ${justifyContent};
        align-content: ${alignContent};
        grid-auto-columns: ${gridAutoColumns};
        grid-auto-rows: ${gridAutoRows};
        grid-auto-flow: ${gridAutoFlow};
      `}
    >
      {children}
    </div>
  );
}
