import React from "react";
import Block from "./Block";
import GridItem from "./GridItem";

import { css } from "@emotion/core";
import styled from "@emotion/styled";
import CardStack from "./CardStack";

let Grid = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  width: 100%;
  padding: 1.25rem;
  max-width: 72rem;
  margin: 1em auto;
  grid-row-gap: 4rem;
  grid-column-gap: 2rem;
`;

type BlockDetailsProps = {
  blockNum: number;
  hash: number | string;
  parentHash: number | string;
  stateRoot: number | string;
  extrinsictRoot: number | string;
  events: React.ElementType[];
  logs: React.ElementType[];
  extrinsic: React.ElementType[];
};

export default function BlockDetails({
  blockNum,
  hash,
  parentHash,
  stateRoot,
  extrinsictRoot,
  events,
  logs,
  extrinsic,
}: BlockDetailsProps) {
  return (
    <Grid>
      <GridItem gridColumn="1 / 3">
        <Block
          hash={hash}
          parentHash={parentHash}
          stateRoot={stateRoot}
          extrinsictRoot={extrinsictRoot}
          blockNum={blockNum}
          isExpanded={true}
        />
      </GridItem>
      <GridItem gridColumn="1">
        <h3>Extrinsic</h3>
        <CardStack items={extrinsic} />
      </GridItem>
      <GridItem gridColumn="2">
        <h3>Events</h3>
        <CardStack items={events} />
      </GridItem>
      <GridItem gridColumn="1">
        <h3>Logs</h3>
        <CardStack items={logs} />
      </GridItem>
    </Grid>
  );
}
