import React from "react";

import Grid from "../src/components/Grid";
import { text } from "@storybook/addon-knobs";
import styled from "@emotion/styled";

export default {
  title: "Grid",
  component: Grid,
  excludeStories: /.*Data$/,
};

// FIXME: This will make storybook lag if the boxes are auto generated
export const GridData = {
  gridTemplateColumns: text("Grid Template Columns", "repeat(4, 1fr)"),
  gridTemplateRows: text("Grid Template Rows", "repeat(3, 1fr)"),
};

let Box = styled.div`
  border: 1px solid #333;
  min-height: 30px;
  min-width: 30px;
`;
export const Default = () => (
  <Grid {...GridData}>
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
    <Box />
  </Grid>
);
