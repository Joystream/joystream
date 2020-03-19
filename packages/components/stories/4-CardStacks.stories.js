import React from "react";

import CardStack from "../src/components/CardStack";
import Block from "../src/components/Block";
import { blockData } from "./1-Block.stories";

export default {
  title: "CardStack",
  component: CardStack,
  excludeStories: /.*Data$/,
};

export const cardStackData = {
  items: Array.from({ length: 5 }, (_, i) => `Card number: ${i}`),
};

export const cardStackBlockData = {
  items: [
    <Block {...blockData} isExpanded={true} />,
    <Block {...blockData} />,
    <Block {...blockData} />,
    <Block {...blockData} />,
  ],
};

export const Default = () => <CardStack {...cardStackData} />;

export const WithBlocks = () => <CardStack {...cardStackBlockData} />;
