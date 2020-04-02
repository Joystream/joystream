import React from "react";
import { Header, Divider, Table, Image } from "semantic-ui-react";

import { Vote } from "./ProposalDetails";

type VotesProps = {
  votes: Vote[];
  total: number;
};

export default function Votes({ votes, total }: VotesProps) {
  return (
    <>
      <Header as="h3">{`All Votes: (${votes.length} / ${total})`}</Header>
      <Divider />
      <Table basic="very">
        <Table.Body>
          {votes.map((vote, idx) => {
            let textColor;
            switch (vote.value) {
              case "Approve": {
                textColor = "text-green";
                break;
              }
              case "Abstain": {
                textColor = "text-grey";
                break;
              }
              case "Reject": {
                textColor = "text-orange";
                break;
              }
              case "Slash": {
                textColor = "text-red";
                break;
              }
            }
            return (
              <Table.Row key={`${vote.by.name}-${idx}`}>
                <Table.Cell className={`${textColor} bold`}>{vote.value}</Table.Cell>
                <Table.Cell>
                  <Image src={vote.by.avatar} avatar /> {vote.by.name}
                </Table.Cell>
                <Table.Cell className="text-grey">{vote.createdAt}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </>
  );
}
