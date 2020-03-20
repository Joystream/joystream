import React from "react";
import { SearchBar } from "../src";
import { text } from "@storybook/addon-knobs";

export default {
  title: "Searchbar",
  component: SearchBar,
  excludeStories: /.*Data$/,
};

export const searchBarData = {
  placeholder: text("Placeholder", "Search for a block hash"),
  value: text("Value", ""),
  cta: text("Call To Action", ""),
  onSubmit: () => {},
  onChange: () => {},
};

export const Default = () => <SearchBar {...searchBarData} />;
