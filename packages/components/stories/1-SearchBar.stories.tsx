import React from "react";

import { SearchBar } from "../src";

export default {
  title: "Search Bar",
  component: SearchBar,
};

export const Default = () => <SearchBar placeholder="asfsg" value="" />;

export const Small = () => (
  <SearchBar placeholder="Dog videos..." value="" size="small" />
);

export const Large = () => (
  <SearchBar placeholder="Kevin's chili..." value="" size="large" />
);
