import React from "react";

import { css } from "@emotion/core";

export default function Link({
  to,
  children,
}: {
  to: string;
  children: JSX.Element | string | number;
}) {
  return (
    <a
      href={to}
      css={css`
        text-decoration: none;
        color: unset;

        &:hover {
          cursor: pointer;
        }
      `}
    >
      {children}
    </a>
  );
}
