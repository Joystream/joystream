import React from "react";
import { css } from "@emotion/core";

type CardProps = {
  children: JSX.Element;
};

export default function Card({ children }: CardProps) {
  return (
    <article
      css={css`
        border: 1px solid rgb(242, 242, 242);
        border-radius: 0.25rem;
        padding: 0.825rem;
        margin-top: 0.25rem;
      `}
    >
      {children}
    </article>
  );
}
