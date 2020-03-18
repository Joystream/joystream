import React from "react";
import { css } from "@emotion/core";

export default function Card({ children }) {
  return (
    <article
      css={css`
        border: 1px solid rgb(242, 242, 242);
        border-radius: 0.25rem;
        padding: 1.25rem;
        margin-top: 0.25rem;
      `}
    >
      {children}
    </article>
  );
}
