import { css } from "@emotion/core";
import React, { ChangeEvent, MouseEvent } from "react";

type SearchBarProps = {
  placeholder?: string;
  cta?: string | JSX.Element;
  value: string;
  onSubmit: (event: MouseEvent) => void;
  onChange: (event: ChangeEvent) => void;
};

export default function SearchBar({
  placeholder,
  value,
  onSubmit = () => {},
  onChange = () => {},
  cta = "Search",
}: SearchBarProps) {
  return (
    <div
      css={css`
        display: flex;
        max-width: 48rem;
        padding: 1.5rem;
        margin: 1rem;
      `}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        css={css`
          padding: 0.5rem 0.25rem;
          border-radius: 5px;
          font-weight: lighter;
          border: 1px solid #eee;
        `}
      />
      <button
        onClick={onSubmit}
        css={css`
          border-radius: 5px;
          background-color: black;
          border: unset;
          padding: 0.5rem;
          color: #eee;
          margin-left: 0.25rem;
        `}
      >
        {cta}
      </button>
    </div>
  );
}
