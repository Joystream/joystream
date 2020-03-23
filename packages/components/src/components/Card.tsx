import React, { FunctionComponent } from "react";
import { css } from "@emotion/core";

type CardProps = {
  children: JSX.Element | JSX.Element[];
};

export default function Card({ children }: CardProps) {
  return (
    <article
      css={css`
        border: 1px solid rgb(242, 242, 242);
        border-radius: 0.25rem;
        text-align: left;
        padding: 1.25rem;
        margin: 0.25rem;
        line-height: 1.4285em;
        box-sizing: border-box;
      `}
    >
      {children}
    </article>
  );
}
