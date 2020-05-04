import React from "react";
import { Card, Header, Item, Button, Icon, Message } from "semantic-ui-react";
import { ProposalType } from "../runtime/transport";
import { blake2AsHex } from '@polkadot/util-crypto';
import styled from 'styled-components';
import AddressMini from '@polkadot/react-components/AddressMiniJoy';
import TxButton from '@polkadot/joy-utils/TxButton';
import { ProposalId } from "@joystream/types/proposals";
import { MemberId } from "@joystream/types/members";

type BodyProps = {
  title: string;
  description: string;
  params: any[];
  type: ProposalType;
  iAmProposer: boolean;
  proposalId: number | ProposalId;
  proposerId: number | MemberId;
  isCancellable: boolean;
  cancellationFee: number;
};

function ProposedAddress(props: { address: string }) {
  return (
    <AddressMini
      value={props.address}
      isShort={false}
      isPadded={false}
      withAddress={true}
      style={{padding: 0}} />
  );
}

// The methods for parsing params by Proposal type.
// They take the params as array and return { LABEL: VALUE } object.
const paramParsers: { [x in ProposalType]: (params: any[]) => { [key: string]: string | number | JSX.Element } } = {
  Text: ([content]) => ({
    "Content": content,
  }),
  RuntimeUpgrade: ([wasm]) => {
    const buffer: Buffer = Buffer.from(wasm.replace('0x', ''), 'hex');
    return {
      "Blake2b256 hash of WASM code": blake2AsHex(buffer, 256),
      "File size": buffer.length + ' bytes',
    }
  },
  SetElectionParameters: ([params]) => ({
      "Announcing period": params.announcingPeriod + " blocks",
      "Voting period": params.votingPeriod + " blocks",
      "Revealing period": params.revealingPeriod + " blocks",
      "Council size": params.councilSize + " members",
      "Candidacy limit": params.candidacyLimit + " members",
      "New term duration": params.newTermDuration + " blocks",
      "Min. council stake": params.minCouncilStake + " tJOY",
      "Min. voting stake": params.minVotingStake + " tJOY"
  }),
  Spending: ([amount, account]) => ({
    "Amount": amount + ' tJOY',
    "Account": <ProposedAddress address={account}/>,
  }),
  SetLead: ([memberId, accountId]) => ({
    "Member id": memberId, // TODO: Link with avatar and handle?
    "Account id": <ProposedAddress address={accountId}/>,
  }),
  SetContentWorkingGroupMintCapacity: ([capacity]) => ({
    "Mint capacity": capacity + ' tJOY',
  }),
  EvictStorageProvider: ([accountId]) => ({
    "Storage provider account": <ProposedAddress address={accountId}/>,
  }),
  SetValidatorCount: ([count]) => ({
    "Validator count": count,
  }),
  SetStorageRoleParameters: ([params]) => ({
    "Min. stake": params.min_stake + " tJOY",
    "Min. actors": params.min_actors,
    "Max. actors": params.max_actors,
    "Reward": params.reward + " tJOY",
    "Reward period": params.reward_period + " blocks",
    "Bonding period": params.bonding_period + " blocks",
    "Unbonding period": params.unbonding_period + " blocks",
    "Min. service period": params.min_service_period + " blocks",
    "Startup grace period": params.startup_grace_period + " blocks",
    "Entry request fee": params.entry_request_fee + " tJOY",
  }),
};

const ProposalParam = styled.div`
  display: flex;
  font-weight: bold;
  margin-bottom: 0.5em;
  @media only screen and (max-width: 767px) {
    flex-direction: column;
  }
`;
const ProposalParamName = styled.div`
  min-width: ${ (p: { longestParamName:number }) =>
    p.longestParamName > 20 ? '240px'
    : (p.longestParamName > 15 ? '200px' : '160px') };
`;
const ProposalParamValue = styled.div`
  color: #000;
`;

export default function Body({
  type,
  title,
  description,
  params = [],
  iAmProposer,
  proposalId,
  proposerId,
  isCancellable,
  cancellationFee
}: BodyProps) {
  const parseParams = paramParsers[type];
  const parsedParams = parseParams(params);
  const longestParamName: number = Object.keys(parsedParams).reduce((a, b) => b.length > a ? b.length : a, 0);
  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Header as="h1">{title}</Header>
        </Card.Header>
        <Card.Description>{description}</Card.Description>
        <Header as="h4">Parameters:</Header>
        <Item.Group style={{ textAlign: "left" }} relaxed>
          { Object.entries(parseParams(params)).map(([paramName, paramValue]) => (
            <ProposalParam key={paramName}>
              <ProposalParamName longestParamName={longestParamName}>{paramName}:</ProposalParamName>
              <ProposalParamValue>{paramValue}</ProposalParamValue>
            </ProposalParam>
          )) }
        </Item.Group>
        { iAmProposer && isCancellable && (<>
          <Message warning active>
            <Message.Content>
              <Message.Header>Proposal cancellation</Message.Header>
              <p style={{ margin: '0.5em 0', padding: '0' }}>
                You can only cancel your proposal while it's still in the Voting Period.
              </p>
              <p style={{ margin: '0.5em 0', padding: '0' }}>
                The cancellation fee for this type of proposal is: <b>{ cancellationFee || 'NONE' }</b>
              </p>
              <Button.Group color="red">
                <TxButton
                  params={ [ proposerId, proposalId ] }
                  tx={ "proposalsEngine.cancelProposal" }
                  onClick={ sendTx => { sendTx(); } }
                  className={'icon left labeled'}
                  >
                  <Icon name="cancel" inverted />
                  Withdraw proposal
                </TxButton>
              </Button.Group>
            </Message.Content>
          </Message>
          </>) }
      </Card.Content>
    </Card>
  );
}
