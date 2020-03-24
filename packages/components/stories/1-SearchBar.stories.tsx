import React from "react";

import SearchBar from "../src/components/SearchBar";

export default {
  title: "Search Bar",
  component: SearchBar,
};

export const Default = () => (
  <SearchBar
    placeholder="asfsg"
    value=""
    onChange={() => {}}
    onSubmit={() => {}}
  />
);
