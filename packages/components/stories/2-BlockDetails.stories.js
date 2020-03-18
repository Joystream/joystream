import React from "react";

import BlockDetails from "../src/components/BlockDetails";
import { blockData } from "./1-Block.stories";

export default {
  title: "BlockDetails",
  component: BlockDetails,
  excludeStories: /.*Data$/,
};

export const BlockDetailsData = {
  extrinsic: ["timestamp.set (#0)", "finalityTracker.finalHint (#1)"],
  events: ["system.ExtrinsicSuccess (#0)", "system.ExtrinsicSuccess (#1)"],
  logs: ["PreRuntime", "Seal"],
};

export const Default = () => (
  <BlockDetails
    {...blockData}
    events={BlockDetailsData.events}
    logs={BlockDetailsData.logs}
    extrinsic={BlockDetailsData.extrinsic}
  />
);
