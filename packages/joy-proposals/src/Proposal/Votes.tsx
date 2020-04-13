import React from "react";
import { Header, Divider, Table, Image, Icon } from "semantic-ui-react";

import Section from "@polkadot/joy-utils/Section";

import { Vote } from "./ProposalDetails";
import useVoteStyles from "./useVoteStyles";

type VotesProps = {
  votes: Vote[];
  total: number;
};

export default function Votes({ votes, total }: VotesProps) {
  return (
    <Section level={3} title={`All Votes: (${votes.length} / ${total})`}>
      <Table basic="very">
        <Table.Body>
          {votes.map((vote, idx) => {
            const { icon, textColor } = useVoteStyles(vote.value);
            return (
              <Table.Row key={`${vote.by.name}-${idx}`}>
                <Table.Cell className={textColor}>
                  <Icon name={icon} />
                  {vote.value}
                </Table.Cell>
                <Table.Cell>
                  <Image src={vote.by.avatar} avatar /> {vote.by.name}
                </Table.Cell>
                <Table.Cell className="text-grey">{vote.createdAt}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Section>
  );
}
