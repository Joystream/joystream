import React from "react";

import Button from "../Button";
import { SearchBarStyleProps, makeStyles } from "./searchBarStyle";

type SearchBarProps = {
  placeholder?: string;
  cta?: string | React.ReactNode;
  value: string;
  onSubmit?: (event: React.MouseEvent) => void;
  onChange?: (event: React.ChangeEvent) => void;
} & SearchBarStyleProps;

export default function SearchBar({
  placeholder,
  value = "",
  onSubmit = () => {},
  onChange = () => {},
  cta = "Search",
  ...styleProps
}: SearchBarProps) {
  let { containerStyle, inputStyle } = makeStyles(styleProps);
  return (
    <div css={containerStyle}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        css={inputStyle}
      />
      <Button color={styleProps.color} onClick={onSubmit}>
        {cta}
      </Button>
    </div>
  );
}
