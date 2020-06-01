import React, { useState } from "react";
import { Card, Container, Menu } from "semantic-ui-react";

import ProposalPreview from "./ProposalPreview";
import { ParsedProposal } from "@polkadot/joy-utils/types/proposals";
import { useTransport , usePromise } from "@polkadot/joy-utils/react/hooks";
import { PromiseComponent } from "@polkadot/joy-utils/react/components";
import { withCalls } from "@polkadot/react-api";
import { BlockNumber } from "@polkadot/types/interfaces";

const filters = ["All", "Active", "Canceled", "Approved", "Rejected", "Slashed", "Expired"] as const;

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
  proposalsMap.set("Canceled", filterProposals("Canceled", proposals));
  proposalsMap.set("Active", filterProposals("Active", proposals));
  proposalsMap.set("Approved", filterProposals("Approved", proposals));
  proposalsMap.set("Rejected", filterProposals("Rejected", proposals));
  proposalsMap.set("Slashed", filterProposals("Slashed", proposals));
  proposalsMap.set("Expired", filterProposals("Expired", proposals));

  return proposalsMap;
}

type ProposalPreviewListProps = {
  bestNumber?: BlockNumber;
};

function ProposalPreviewList({ bestNumber }: ProposalPreviewListProps) {
  const transport = useTransport();
  const [proposals, error, loading] = usePromise<ParsedProposal[]>(() => transport.proposals.proposals(), []);
  const [activeFilter, setActiveFilter] = useState<ProposalFilter>("All");

  const proposalsMap = mapFromProposals(proposals);
  const filteredProposals = proposalsMap.get(activeFilter) as ParsedProposal[];

  return (
    <Container className="Proposal">
      <PromiseComponent error={ error } loading={ loading } message="Fetching proposals...">
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
        {
          filteredProposals.length ? (
            <Card.Group>
              {filteredProposals.map((prop: ParsedProposal, idx: number) => (
                <ProposalPreview key={`${prop.title}-${idx}`} proposal={prop} bestNumber={bestNumber} />
              ))}
            </Card.Group>
          ) : `There are currently no ${ activeFilter !== 'All' ? activeFilter.toLocaleLowerCase() : 'submitted' } proposals.`
        }
      </PromiseComponent>
    </Container>
  );
}

export default withCalls<ProposalPreviewListProps>(["derive.chain.bestNumber", { propName: "bestNumber" }])(
  ProposalPreviewList
);
