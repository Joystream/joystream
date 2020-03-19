import React from "react";

import { css } from "@emotion/core";

type ColumnProps = {
  children: React.ElementType;
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
