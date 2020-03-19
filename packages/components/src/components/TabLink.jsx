import React from "react";
import { css } from "@emotion/core";

export default function TabLink({ to, label, isSelected = false }) {
  return (
    <div
      css={css`
        border-bottom: ${isSelected ? "2px solid rgb(241, 145, 53)" : "none"};
        font-weight: ${isSelected ? "bold" : "normal"};
        padding: 0.825rem;
        max-width: 8rem;
        text-align: center;
      `}
    >
      <a
        href={to}
        css={css`
          text-decoration: none;
          color: inherit;
        `}
      >
        {label}
      </a>
    </div>
  );
}
