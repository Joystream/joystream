import React from "react";

import { css } from "@emotion/core";

type ColumnProps = {
  children: JSX.Element | JSX.Element[];
  span: string | number;
};

export default function Column({ children, span }: ColumnProps) {
  return (
    <div
      css={css`
        grid-column: ${span};
      `}
    >
      {children}
    </div>
  );
}
