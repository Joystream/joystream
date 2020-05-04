import React, { useState } from "react";
import { Card, Container, Menu } from "semantic-ui-react";

import ProposalPreview from "./ProposalPreview";
import { useTransport, ParsedProposal } from "../runtime";
import { usePromise } from "../utils";
import Loading from "./Loading";
import Error from "./Error";
import { withCalls } from "@polkadot/react-api";
import { BlockNumber } from "@polkadot/types/interfaces";

type ProposalFilter = "All" | "Active" | "Withdrawn" | "Approved" | "Rejected" | "Slashed";

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
        <Menu.Item
          name={`all - ${proposalsMap.get("All").length} `}
          active={activeFilter === "All"}
          onClick={() => setActiveFilter("All")}
        />
        <Menu.Item
          name={`withdrawn (${proposalsMap.get("Withdrawn").length})`}
          active={activeFilter === "Withdrawn"}
          onClick={() => setActiveFilter("Withdrawn")}
        />
        <Menu.Item
          name={`active (${proposalsMap.get("Active").length})`}
          active={activeFilter === "Active"}
          onClick={() => setActiveFilter("Active")}
        />
        <Menu.Item
          name={`approved (${proposalsMap.get("Approved").length})`}
          active={activeFilter === "Approved"}
          onClick={() => setActiveFilter("Approved")}
        />
        <Menu.Item
          name={`rejected (${proposalsMap.get("Rejected").length})`}
          active={activeFilter === "Rejected"}
          onClick={() => setActiveFilter("Rejected")}
        />
        <Menu.Item
          name={`slashed (${proposalsMap.get("Slashed").length})`}
          active={activeFilter === "Slashed"}
          onClick={() => setActiveFilter("Slashed")}
        />
      </Menu>

      <Card.Group>
        {proposalsMap.get(activeFilter).map((prop: ParsedProposal, idx: number) => (
          <ProposalPreview key={`${prop.title}-${idx}`} proposal={prop} bestNumber={bestNumber} />
        ))}
      </Card.Group>
    </Container>
  );
}

export default withCalls<ProposalPreviewListProps>(["derive.chain.bestNumber", { propName: "bestNumber" }])(
  ProposalPreviewList
);
