import React, { useState } from "react";
import { CardStack, Block, ContentLabel, Event } from "components";

const blockData = {
  blockNum: 1854,
  hash: "0x080d672d268a72cae5b255918c1c832439869d6b9b36933734612ba7cd53f2db",

  parentHash:
    "0xdfe6522b146213accfb65c16ba82ad96e0cc737abe21eb28bbea80135e08e2d4",

  stateRoot:
    "0xb0486392387dc820afb96ecd3b0d8f129538b789d811d0e82d86607d45424664",

  extrinsictRoot:
    "0x3f4378235b086fd65dd5d3650c8ef82e1b75297e884389ad1037fcc966a9ae05",
};

let recentBlocks = [
  <Block {...blockData} isExpanded={true} />,
  <Block {...blockData} />,
  <Block {...blockData} />,
  <Block {...blockData} />,
];

let recentEvents = Array.from({ length: 5 }, (_, i) => (
  <Event
    title={`imOnline.HeartbeatReceived (#${i})`}
    summary={`a new hearthbeat was received from Authority Id`}
  />
));

let lastBlockTime = "4.6s";
let timeTarget = "6s";
let totalIssuance = "10.674M";

export default function Explorer() {
  let [tab, setTab] = useState(0);
  return (
    <>
      <div className="explorer-summary">
        <section>
          <ContentLabel label="Last Block" data={lastBlockTime}></ContentLabel>
          <ContentLabel label="Target" data={timeTarget}></ContentLabel>
          <ContentLabel
            label="total issuance"
            data={totalIssuance}
          ></ContentLabel>
        </section>
        <section>
          <ContentLabel
            label="Epoch"
            data={79}
            maxProgress={100}
            withProgress={true}
          />
        </section>
        <section>
          <ContentLabel label="finalized" data={84158}></ContentLabel>
          <ContentLabel label="best" data={84167}></ContentLabel>
        </section>
      </div>
      <div className="explorer-columnar">
        <div className="explorer-column">
          <h1 className="column-header">Recent Blocks</h1>
          <CardStack items={recentBlocks} />
        </div>
        <div className="explorer-column">
          <h1 className="column-header">Recent Events</h1>
          <CardStack items={recentEvents} className="events-col" />
        </div>
      </div>
    </>
  );
}
