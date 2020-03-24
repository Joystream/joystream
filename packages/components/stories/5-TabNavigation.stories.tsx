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
    {
      label: "Chain Info",
      to: "#",
    },
    {
      label: "Block Details",
      to: "#",
    },
    {
      label: "Forks",
      to: "#",
      isSelected: true,
    },
    {
      label: "Node Info",
      to: "#",
    },
  ],
};

export const Default = () => <TabNavigation {...tabNavigationData} />;
