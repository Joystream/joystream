import React from "react";
import { TabLink } from "../src";
import { boolean, text } from "@storybook/addon-knobs";

export default {
  title: "Tab Link",
  component: TabLink,
  excludeStories: /.*Data$/,
};

export const Default = () => (
  <TabLink
    isSelected={boolean("isSelected", false)}
    label={text("Label", "Block Details")}
    to="someawesomeplace"
  />
);
