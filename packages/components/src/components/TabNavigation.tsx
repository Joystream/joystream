import React from "react";
import { css } from "@emotion/core";

type TabNavigationProps = {
  selected: number;
  links: JSX.Element[];
  onClick: (n: number) => void;
};

export default function TabNavigation({
  links,
  selected,
  onClick,
}: TabNavigationProps) {
  return (
    <div
      css={css`
        display: flex;
        justify-content: flex-start;
        border-bottom: 1px solid #eee;
      `}
    >
      {links.map((link, idx) => (
        <div
          css={css`
            border-bottom: ${idx === selected
              ? "2px solid rgb(241, 145, 53)"
              : "none"};
            font-weight: ${idx === selected ? "bold" : "normal"};
            padding: 0.825rem;
            margin-right: 0.5rem;
            max-width: 8rem;
            text-align: center;

            &:hover {
              cursor: pointer;
            }
          `}
          onClick={e => onClick(idx)}
          key={`${idx}-link`}
        >
          {link}
        </div>
      ))}
    </div>
  );
}
