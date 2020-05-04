import React, { useState } from "react";
import { Card, Container, Menu } from "semantic-ui-react";

import ProposalPreview from "./ProposalPreview";
import { useTransport, ParsedProposal } from "../runtime";
import { usePromise } from "../utils";
import Loading from "./Loading";
import Error from "./Error";
import { withCalls } from "@polkadot/react-api";
import { BlockNumber } from "@polkadot/types/interfaces";

const filters = ["All", "Active", "Withdrawn", "Approved", "Rejected", "Slashed"] as const;

type ProposalFilter = typeof filters[number];

function filterProposals(filter: ProposalFilter, proposals: ParsedProposal[]) {
  if (filter === "All") {
    return proposals;
  } else if (filter === "Active") {
    return proposals.filter((prop: ParsedProposal) => {
      const [activeOrFinalized] = Object.keys(prop.status);
      return activeOrFinalized === "Active";
    });
  }

  return proposals.filter((prop: ParsedProposal) => {
    // Either Active or undefined for some reason
    if (prop.status.Finalized == null || prop.status.Finalized.proposalStatus == null) {
      return false;
    }

    const [finalStatus] = Object.keys(prop.status.Finalized.proposalStatus);
    return finalStatus === filter;
  });
}

function mapFromProposals(proposals: ParsedProposal[]) {
  const proposalsMap = new Map<ProposalFilter, ParsedProposal[]>();

  proposalsMap.set("All", proposals);
  proposalsMap.set("Withdrawn", filterProposals("Withdrawn", proposals));
  proposalsMap.set("Active", filterProposals("Active", proposals));
  proposalsMap.set("Approved", filterProposals("Approved", proposals));
  proposalsMap.set("Rejected", filterProposals("Rejected", proposals));
  proposalsMap.set("Slashed", filterProposals("Slashed", proposals));

  return proposalsMap;
}

type ProposalPreviewListProps = {
  bestNumber?: BlockNumber;
};

function ProposalPreviewList({ bestNumber }: ProposalPreviewListProps) {
  const transport = useTransport();
  const [proposals, error, loading] = usePromise<ParsedProposal[]>(() => transport.proposals(), []);
  const [activeFilter, setActiveFilter] = useState<ProposalFilter>("All");

  if (loading && !error) {
    return <Loading text="Fetching proposals..." />;
  } else if (error) {
    return <Error error={error} />;
  }

  const proposalsMap = mapFromProposals(proposals);

  console.log({ proposals, error, loading });
  console.log(proposalsMap);

  return (
    <Container className="Proposal">
      <Menu tabular className="list-menu">
        {filters.map((filter, idx) => (
          <Menu.Item
            key={`${filter} - ${idx}`}
            name={`${filter.toLowerCase()} - ${(proposalsMap.get(filter) as ParsedProposal[]).length}`}
            active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          />
        ))}
      </Menu>

      <Card.Group>
        {(proposalsMap.get(activeFilter) as ParsedProposal[]).map((prop: ParsedProposal, idx: number) => (
          <ProposalPreview key={`${prop.title}-${idx}`} proposal={prop} bestNumber={bestNumber} />
        ))}
      </Card.Group>
    </Container>
  );
}

export default withCalls<ProposalPreviewListProps>(["derive.chain.bestNumber", { propName: "bestNumber" }])(
  ProposalPreviewList
);
