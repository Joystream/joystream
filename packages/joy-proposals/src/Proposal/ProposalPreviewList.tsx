import React, { useState, useEffect } from "react";
import { Card, Menu, Container, Loader } from "semantic-ui-react";

import { ProposalProps } from "./ProposalDetails";
import ProposalPreview from "./ProposalPreview";
import { useTransport, ParsedProposal } from "../runtime";
import { usePromise } from "../utils";
import Loading from "./Loading";
import Error from "./Error";
import { withCalls } from '@polkadot/react-api';
import { BlockNumber } from '@polkadot/types/interfaces';

// type ProposalFilter = "all" | "active" | "withdrawn" | "approved" | "rejected" | "slashed";

// function filterProposals(filter: ProposalFilter, proposals: ParsedProposal[]) {
//   if (filter === "all") {
//     return proposals;
//   } else if (filter === "active") {
//     return proposals.filter((prop: ParsedProposal) => prop.details.stage === "active");
//   }

//   return proposals.filter((prop: ParsedProposal) => prop.finalized === filter);
// }

// function mapFromProposals(proposals: ParsedProposal[]) {
//   const proposalsMap = new Map();

//   proposalsMap.set("all", proposals);
//   proposalsMap.set("withdrawn", filterProposals("withdrawn", proposals));
//   proposalsMap.set("active", filterProposals("withdrawn", proposals));
//   proposalsMap.set("approved", filterProposals("approved", proposals));
//   proposalsMap.set("rejected", filterProposals("rejected", proposals));
//   proposalsMap.set("slashed", filterProposals("slashed", proposals));

//   return proposalsMap;
// }

type ProposalPreviewListProps = {
  bestNumber?: BlockNumber
};

function ProposalPreviewList({ bestNumber }: ProposalPreviewListProps) {
  const transport = useTransport();

  const [proposals, error, loading] = usePromise<ParsedProposal[]>(transport.proposals(), []);

  if (loading && !error) {
    return <Loading text="Fetching proposals..." />;
  } else if (error) {
    return <Error error={error} />;
  }
  console.log(proposals);

  return (
    <Container className="Proposal">
      {/* <Menu tabular className="list-menu">
        <Menu.Item
          name={`all - ${proposalsMap.get("withdrawn").length} `}
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <Menu.Item
          name={`withdrawn (${proposalsMap.get("withdrawn").length})`}
          active={activeFilter === "withdrawn"}
          onClick={() => setActiveFilter("withdrawn")}
        />
        <Menu.Item
          name={`active (${proposalsMap.get("active").length})`}
          active={activeFilter === "active"}
          onClick={() => setActiveFilter("active")}
        />
        <Menu.Item
          name={`approved (${proposalsMap.get("approved").length})`}
          active={activeFilter === "approved"}
          onClick={() => setActiveFilter("approved")}
        />
        <Menu.Item
          name={`rejected (${proposalsMap.get("rejected").length})`}
          active={activeFilter === "rejected"}
          onClick={() => setActiveFilter("rejected")}
        />
        <Menu.Item
          name={`slashed (${proposalsMap.get("slashed").length})`}
          active={activeFilter === "slashed"}
          onClick={() => setActiveFilter("slashed")}
        />
      </Menu> */}

      <Card.Group>
        {proposals.map((prop: ParsedProposal, idx: number) => (
          <ProposalPreview
            key={`${prop.title}-${idx}`}
            proposal={prop}
            bestNumber={ bestNumber }
          />
        ))}
      </Card.Group>
    </Container>
  );
}

export default withCalls<ProposalPreviewListProps>(
  ['derive.chain.bestNumber', { propName: 'bestNumber' }]
)(ProposalPreviewList);
