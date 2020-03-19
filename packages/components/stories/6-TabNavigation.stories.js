import React from "react";
import TabNavigation from "../src/components/TabNavigation";

export default {
  title: "Tab Links",
  component: TabNavigation,
  excludeStories: /.*Data$/,
};

export const tabNavigationData = {
  links: [
    {
      label: "Chain Info",
      to: "#",
      isSelected: false,
    },
    {
      label: "Block Details",
      to: "#",
      isSelected: false,
    },
    {
      label: "Forks",
      to: "#",
      isSelected: true,
    },
    {
      label: "Node Info",
      to: "#",
      isSelected: false,
    },
  ],
};

export const Default = () => <TabNavigation {...tabNavigationData} />;
