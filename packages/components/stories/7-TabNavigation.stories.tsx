import React from "react";
import { TabNavigation } from "../src";
import { number } from "@storybook/addon-knobs";

export default {
  title: "Tab Links",
  component: TabNavigation,
  excludeStories: /.*Data$/,
};

export const tabNavigationData = {
  selected: number("Selected", 2),
  links: [
    <a href="to">Chain Info</a>,
    <a href="to">Block Details</a>,
    <a href="to">Forks</a>,
    <a href="to">Node</a>,
  ],
};

export const Default = () => <TabNavigation {...tabNavigationData} />;
