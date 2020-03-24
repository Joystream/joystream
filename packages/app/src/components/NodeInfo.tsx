import React from "react";

import { ContentLabel, Table, Card, CardStack, Event } from "components";

let tableElements = Array.from({ length: 15 }, (_, i) => ({
  role: "authority",
  peerId: "QmcCpVnG31STYhc76v7yNPAVbTUZMRcw73AsY9L6hkfhVN",
  best: "96,058",
  bestHash:
    "0xdfeb750cc3c0572b2af793f9135b65961563bb4645b6be9262391f67ae86fdd6",
}));

let pendingExtrinsics = [<Card>no pending extrinsics are in the queue</Card>];

export default function NodeInfo() {
  return (
    <>
      <div className="explorer-summary">
        <section>
          <ContentLabel label="refresh in" data={6}></ContentLabel>
          <ContentLabel label="total peers" data={36}></ContentLabel>
          <ContentLabel label="syncing" data="no"></ContentLabel>
        </section>
        <section>
          <ContentLabel label="queued tx" data={0} />
        </section>
        <section>
          <ContentLabel label="peer best" data={95920}></ContentLabel>
          <ContentLabel label="our best" data={95923}></ContentLabel>
        </section>
      </div>
      <section className="explorer-node-table">
        <h1>Connected peers</h1>
        <Card>
          <Table elements={tableElements}></Table>
        </Card>
      </section>
      <div className="explorer-columnar">
        <div className="explorer-column">
          <h1 className="column-header">pending extrinsicts</h1>
          <CardStack items={pendingExtrinsics} />
        </div>
      </div>
    </>
  );
}
