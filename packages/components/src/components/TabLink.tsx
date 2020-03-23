import React from "react";
import { css } from "@emotion/core";

export type LinkType = {
  label: string;
  to: string;
};

type TabLinkProps = LinkType & {
  isSelected?: boolean;
};

export default function TabLink({
  to,
  label,
  isSelected = false,
}: TabLinkProps) {
  return (
    <div
      css={css`
        border-bottom: ${isSelected ? "2px solid rgb(241, 145, 53)" : "none"};
        font-weight: ${isSelected ? "bold" : "normal"};
        padding: 0.825rem;
        margin-right: 0.5rem;
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
