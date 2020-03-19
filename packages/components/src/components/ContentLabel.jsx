import React from "react";

import { css } from "@emotion/core";

export default function ContentLabel({
  label,
  data,
  withProgress,
  maxProgress,
}) {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        text-align: center;
        padding: 0.825rem;
        margin: 0.5rem;
        max-width: 12rem;
      `}
    >
      <label
        css={css`
          font-weight: lighter;
        `}
      >
        {label}
      </label>
      <span
        css={css`
          font-size: 2rem;
          font-weight: bold;
          margin-top: 0.25rem;
        `}
      >
        {`${data}${withProgress ? `\/${maxProgress}` : ""}`}
      </span>
      {withProgress && (
        <div
          css={css`
            height: 0.25rem;
            min-width: 60%;
            margin: auto;
            background: #eee;
            border-radius: 25px;
          `}
        >
          <span
            css={css`
              display: block;
              height: 100%;
              width: ${(data * 100) / maxProgress}%;
              background-color: blue;
              border-radius: 25px;
            `}
          ></span>
        </div>
      )}
    </div>
  );
}
