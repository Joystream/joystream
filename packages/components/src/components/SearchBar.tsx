import React, { ChangeEvent, MouseEvent } from "react";
import { css } from "@emotion/core";

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
  onSubmit,
  onChange,
  cta,
}: SearchBarProps) {
  return (
    <div
      css={css`
        display: flex;
      `}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button onClick={onSubmit}>{cta}</button>
    </div>
  );
}
