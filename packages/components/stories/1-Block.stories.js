import React from "react";
import { Block } from "../src/";
import { text } from "@storybook/addon-knobs";

export default {
  title: "Block",
  component: Block,
  excludeStories: /.*Data$/,
};

export const blockData = {
  blockNum: 1854,
  hash: text(
    "hash",
    "0x080d672d268a72cae5b255918c1c832439869d6b9b36933734612ba7cd53f2db"
  ),
  parentHash: text(
    "Parent Hash",
    "0xdfe6522b146213accfb65c16ba82ad96e0cc737abe21eb28bbea80135e08e2d4"
  ),
  stateRoot: text(
    "State Root",
    "0xb0486392387dc820afb96ecd3b0d8f129538b789d811d0e82d86607d45424664"
  ),
  extrinsictRoot: text(
    "Extrinsic Root",
    "0x3f4378235b086fd65dd5d3650c8ef82e1b75297e884389ad1037fcc966a9ae05"
  ),
};

export const Default = () => <Block {...blockData} isExpanded={true} />;
export const Collapsed = () => <Block {...blockData} isExpanded={false} />;
