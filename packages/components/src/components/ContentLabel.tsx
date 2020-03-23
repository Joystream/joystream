import React from "react";

import { css } from "@emotion/core";

type ContentLabelProps = {
  label: string;
  data: string | number;
  withProgress?: boolean;
  maxProgress?: number;
};

export default function ContentLabel({
  label,
  data,
  withProgress = false,
  maxProgress,
}: ContentLabelProps) {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        text-align: center;
        padding: 0.825rem;
        margin: 0.5rem;
        font-weight: 100;
        font-size: 2.1rem;
        line-height: 2.1rem;
        text-align: right;
        max-width: 12rem;

        & label {
          line-height: 1rem;
          font-size: 0.85rem;
          min-height: 1rem;
        }

        & span {
          display: block;
          margin: 0.6rem 0;
        }
      `}
    >
      <label>{label}</label>
      <span>{`${data}${withProgress ? `\/${maxProgress}` : ""}`}</span>
      {withProgress && (
        <div
          css={css`
            font-size: 0.5rem;
            background: #eee;
            border-radius: 0.3rem;
            background-color: rgba(0, 0, 0, 0.05);
            margin: 0.2rem 0 -0.5rem;
          `}
        >
          <div
            css={css`
              height: 0.5em;
              width: ${(+data * 100) / maxProgress}%;
              background-color: #2185d0;
              border-radius: 0.3rem;
            `}
          ></div>
        </div>
      )}
    </div>
  );
}
