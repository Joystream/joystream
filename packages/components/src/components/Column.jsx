import React from "react";

import { css } from "@emotion/core";

export default function Column({ children, span }) {
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
