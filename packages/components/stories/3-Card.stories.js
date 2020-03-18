import React from "react";

import Card from "../src/components/Card";
import Block from "../src/components/Block";
import { blockData } from "./1-Block.stories";
import { text } from "@storybook/addon-knobs";

export default {
  title: "Card",
  component: Card,
  excludeStories: /.*Data$/,
};

export const Default = () => (
  <Card>
    <div>{text("Card Content", "This is the inside of the card.")} </div>
  </Card>
);

export const withBlock = () => (
  <Card>
    <Block {...blockData} isExpanded={true}></Block>
  </Card>
);
