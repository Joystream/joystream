import React from "react";

import { ContentLabel } from "../src";
import { text } from "@storybook/addon-knobs";

export default {
  title: "Content Label",
  component: ContentLabel,
  excludeStories: /.*Data$/,
};

export const Default = () => (
  <ContentLabel label={text("Label", "Total Issuance")} data={"10.645M"} />
);

export const withProgress = () => (
  <ContentLabel
    label={text("Label", "epoch")}
    data={44}
    withProgress={true}
    maxProgress={100}
  />
);
