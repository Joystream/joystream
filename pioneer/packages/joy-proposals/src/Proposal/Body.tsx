import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Header, Button, Icon, Message } from 'semantic-ui-react';
import { ProposalType } from '@polkadot/joy-utils/types/proposals';
import { bytesToString } from '@polkadot/joy-utils/functions/misc';
import { blake2AsHex } from '@polkadot/util-crypto';
import styled from 'styled-components';
import AddressMini from '@polkadot/react-components/AddressMiniJoy';
import TxButton from '@polkadot/joy-utils/TxButton';
import { ProposalId, TerminateRoleParameters } from '@joystream/types/proposals';
import { MemberId, Profile } from '@joystream/types/members';
import ProfilePreview from '@polkadot/joy-utils/MemberProfilePreview';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { Option, Bytes } from '@polkadot/types/';
import { formatBalance } from '@polkadot/util';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import ReactMarkdown from 'react-markdown';
import { WorkingGroupOpeningPolicyCommitment, RewardPolicy } from '@joystream/types/working-group';
import {
  ActivateOpeningAt,
  ActivateOpeningAtKeys
} from '@joystream/types/hiring';
import { WorkingGroup, WorkingGroupKeys } from '@joystream/types/common';
import { ApplicationsDetailsByOpening } from '@polkadot/joy-utils/react/components/working-groups/ApplicationDetails';
import { LeadInfoFromId } from '@polkadot/joy-utils/react/components/working-groups/LeadInfo';
import { formatReward } from '@polkadot/joy-utils/functions/format';

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

function ProposedAddress (props: { address?: string | null }) {
  if (props.address === null || props.address === undefined) {
    return <>NONE</>;
  }

  return (
    <AddressMini value={props.address} isShort={false} isPadded={false} withAddress={true} style={{ padding: 0 }} />
  );
}

function ProposedMember (props: { memberId?: MemberId | number | null }) {
  if (props.memberId === null || props.memberId === undefined) {
    return <>NONE</>;
  }
  const memberId: MemberId | number = props.memberId;

  const transport = useTransport();
  const [member, error, loading] = usePromise<Option<Profile> | null>(
    () => transport.members.memberProfile(memberId),
    null
  );

  const profile = member && member.unwrapOr(null);

  return (
    <PromiseComponent error={error} loading={loading} message="Fetching profile...">
      { profile ? (
        <ProfilePreview
          avatar_uri={ profile.avatar_uri.toString() }
          root_account={ profile.root_account.toString() }
          handle={ profile.handle.toString() }
          link={ true }
        />
      ) : 'Profile not found' }
    </PromiseComponent>
  );
}

const ParsedHRT = styled.pre`
  font-size: 14px;
  font-weight: normal;
  background: #eee;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0;
  white-space: pre-wrap;
`;

type ParsedParamValue = string | number | JSX.Element;
class FullWidthParam {
  value: ParsedParamValue;
  constructor (value: ParsedParamValue) {
    this.value = value;
  }
}
type ParsedParams = { [paramName: string]: ParsedParamValue | FullWidthParam };

// The methods for parsing params by Proposal type.
// They take the params as array and return { LABEL: VALUE } object.
const paramParsers: { [x in ProposalType]: (params: any[]) => ParsedParams} = {
  Text: ([content]) => ({
    Content: new FullWidthParam(
      <ReactMarkdown className='TextProposalContent' source={content} linkTarget='_blank' />
    )
  }),
  RuntimeUpgrade: ([wasm]) => {
    const buffer: Buffer = Buffer.from(wasm.replace('0x', ''), 'hex');
    return {
      'Blake2b256 hash of WASM code': new FullWidthParam(blake2AsHex(buffer, 256)),
      'File size': buffer.length + ' bytes'
    };
  },
  SetElectionParameters: ([params]) => ({
    'Announcing period': params.announcing_period + ' blocks',
    'Voting period': params.voting_period + ' blocks',
    'Revealing period': params.revealing_period + ' blocks',
    'Council size': params.council_size + ' members',
    'Candidacy limit': params.candidacy_limit + ' members',
    'New term duration': params.new_term_duration + ' blocks',
    'Min. council stake': formatBalance(params.min_council_stake),
    'Min. voting stake': formatBalance(params.min_voting_stake)
  }),
  Spending: ([amount, account]) => ({
    Amount: formatBalance(amount),
    Account: <ProposedAddress address={account} />
  }),
  SetLead: ([memberId, accountId]) => ({
    Member: <ProposedMember memberId={ memberId } />,
    'Account id': <ProposedAddress address={accountId} />
  }),
  SetContentWorkingGroupMintCapacity: ([capacity]) => ({
    'Mint capacity': formatBalance(capacity)
  }),
  EvictStorageProvider: ([accountId]) => ({
    'Storage provider account': <ProposedAddress address={accountId} />
  }),
  SetValidatorCount: ([count]) => ({
    'Validator count': count
  }),
  SetStorageRoleParameters: ([params]) => ({
    'Min. stake': formatBalance(params.min_stake),
    // "Min. actors": params.min_actors,
    'Max. actors': params.max_actors,
    Reward: formatBalance(params.reward),
    'Reward period': params.reward_period + ' blocks',
    // "Bonding period": params.bonding_period + " blocks",
    'Unbonding period': params.unbonding_period + ' blocks',
    // "Min. service period": params.min_service_period + " blocks",
    // "Startup grace period": params.startup_grace_period + " blocks",
    'Entry request fee': formatBalance(params.entry_request_fee)
  }),
  AddWorkingGroupLeaderOpening: ([{ activate_at, commitment, human_readable_text, working_group }]) => {
    const workingGroup = new WorkingGroup(working_group);
    const activateAt = new ActivateOpeningAt(activate_at);
    const activateAtBlock = activateAt.type === ActivateOpeningAtKeys.ExactBlock ? activateAt.value : null;
    const OPCommitment = new WorkingGroupOpeningPolicyCommitment(commitment);
    const {
      application_staking_policy: aSP,
      role_staking_policy: rSP,
      application_rationing_policy: rationingPolicy
    } = OPCommitment;
    let HRT = bytesToString(new Bytes(human_readable_text));
    try { HRT = JSON.stringify(JSON.parse(HRT), undefined, 4); } catch (e) { /* Do nothing */ }
    return {
      'Working group': workingGroup.type,
      'Activate at': `${activateAt.type}${activateAtBlock ? `(${activateAtBlock.toString()})` : ''}`,
      'Application stake': aSP.isSome ? aSP.unwrap().amount_mode.type + `(${aSP.unwrap().amount})` : 'NONE',
      'Role stake': rSP.isSome ? rSP.unwrap().amount_mode.type + `(${rSP.unwrap().amount})` : 'NONE',
      'Max. applications': rationingPolicy.isSome ? rationingPolicy.unwrap().max_active_applicants.toNumber() : 'UNLIMITED',
      'Terminate unstaking period (role stake)': OPCommitment.terminate_role_stake_unstaking_period.unwrapOr(0) + ' blocks',
      'Exit unstaking period (role stake)': OPCommitment.exit_role_stake_unstaking_period.unwrapOr(0) + ' blocks',
      // <required_to_prevent_sneaking>
      'Terminate unstaking period (appl. stake)': OPCommitment.terminate_application_stake_unstaking_period.unwrapOr(0) + ' blocks',
      'Exit unstaking period (appl. stake)': OPCommitment.exit_role_application_stake_unstaking_period.unwrapOr(0) + ' blocks',
      'Appl. accepted unstaking period (appl. stake)': OPCommitment.fill_opening_successful_applicant_application_stake_unstaking_period.unwrapOr(0) + ' blocks',
      'Appl. failed unstaking period (role stake)': OPCommitment.fill_opening_failed_applicant_role_stake_unstaking_period.unwrapOr(0) + ' blocks',
      'Appl. failed unstaking period (appl. stake)': OPCommitment.fill_opening_failed_applicant_application_stake_unstaking_period.unwrapOr(0) + ' blocks',
      'Crowded out unstaking period (role stake)': ((rSP.isSome && rSP.unwrap().crowded_out_unstaking_period_length.unwrapOr(0)) || 0) + ' blocks',
      'Review period expierd unstaking period (role stake)': ((rSP.isSome && rSP.unwrap().review_period_expired_unstaking_period_length.unwrapOr(0)) || 0) + ' blocks',
      'Crowded out unstaking period (appl. stake)': ((aSP.isSome && aSP.unwrap().crowded_out_unstaking_period_length.unwrapOr(0)) || 0) + ' blocks',
      'Review period expierd unstaking period (appl. stake)': ((aSP.isSome && aSP.unwrap().review_period_expired_unstaking_period_length.unwrapOr(0)) || 0) + ' blocks',
      // </required_to_prevent_sneaking>
      'Human readable text': new FullWidthParam(<ParsedHRT>{ HRT }</ParsedHRT>)
    };
  },
  SetWorkingGroupMintCapacity: ([capacity, group]) => {
    return {
      'Working group': (new WorkingGroup(group)).type,
      'Mint capacity': formatBalance(capacity)
    };
  },
  BeginReviewWorkingGroupLeaderApplication: ([id, group]) => {
    return {
      'Working group': (new WorkingGroup(group)).type,
      // TODO: Adjust the link to work with multiple groups after working-groups are normalized!
      'Opening id': <Link to={`/working-groups/opportunities/storageProviders/${id}`}>#{id}</Link>
    };
  },
  FillWorkingGroupLeaderOpening: ([params]) => {
    const { opening_id, successful_application_id, reward_policy, working_group } = params;
    const rp = reward_policy && new RewardPolicy(reward_policy);
    return {
      'Working group': (new WorkingGroup(working_group)).type,
      // TODO: Adjust the link to work with multiple groups after working-groups are normalized!
      'Opening id': <Link to={`/working-groups/opportunities/storageProviders/${opening_id}`}>#{opening_id}</Link>,
      'Reward policy': rp ? formatReward(rp, true) : 'NONE',
      Result: new FullWidthParam(
        <ApplicationsDetailsByOpening
          openingId={opening_id}
          acceptedIds={[successful_application_id]}
          group={(new WorkingGroup(working_group)).type as WorkingGroupKeys}/>
      )
    };
  },
  SlashWorkingGroupLeaderStake: ([leadId, amount, group]) => ({
    'Working group': (new WorkingGroup(group)).type,
    'Slash amount': formatBalance(amount),
    Lead: new FullWidthParam(<LeadInfoFromId group={(new WorkingGroup(group).type as WorkingGroupKeys)} leadId={leadId}/>)
  }),
  DecreaseWorkingGroupLeaderStake: ([leadId, amount, group]) => ({
    'Working group': (new WorkingGroup(group)).type,
    'Decrease amount': formatBalance(amount),
    Lead: new FullWidthParam(<LeadInfoFromId group={(new WorkingGroup(group).type as WorkingGroupKeys)} leadId={leadId}/>)
  }),
  SetWorkingGroupLeaderReward: ([leadId, amount, group]) => ({
    'Working group': (new WorkingGroup(group)).type,
    'New reward amount': formatBalance(amount),
    Lead: new FullWidthParam(<LeadInfoFromId group={(new WorkingGroup(group).type as WorkingGroupKeys)} leadId={leadId}/>)
  }),
  TerminateWorkingGroupLeaderRole: ([params]) => {
    const paramsObj = new TerminateRoleParameters(params);
    const { working_group: workingGroup, rationale, worker_id: leadId, slash } = paramsObj;
    return {
      'Working group': workingGroup.type,
      Rationale: new FullWidthParam(bytesToString(rationale)),
      'Slash stake': slash.isTrue ? 'YES' : 'NO',
      Lead: new FullWidthParam(<LeadInfoFromId group={workingGroup.type as WorkingGroupKeys} leadId={leadId.toNumber()}/>)
    };
  }
};

const StyledProposalDescription = styled(Card.Description)`
  font-size: 1.15rem;
`;
const ProposalParams = styled.div`
  border: 1px solid rgba(0,0,0,.2);
  padding: 1.5rem 2rem 1rem 2rem;
  position: relative;
  margin-top: 1.7rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 1rem;
  grid-row-gap: 0.5rem;
  @media screen and (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;
const ParamsHeader = styled.h4`
  position: absolute;
  top: 0;
  transform: translateY(-50%);
  background: #fff;
  font-weight: normal;
  padding: 0.3rem;
  left: 0.5rem;
`;
type ProposalParamProps = { fullWidth?: boolean };
const ProposalParam = ({ fullWidth, children }: React.PropsWithChildren<ProposalParamProps>) => (
  <div style={{ gridColumn: (fullWidth || undefined) && '1/3' }}>
    { children }
  </div>
);
const ProposalParamName = styled.div`
  font-size: 0.9rem;
  font-weight: normal;
`;
const ProposalParamValue = styled.div`
  color: black;
  word-wrap: break-word;
  word-break: break-word;
  font-size: 1.15rem;
  font-weight: bold;
  & .TextProposalContent {
    font-weight: normal;
  }
`;

export default function Body ({
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
  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Header as="h1">{title}</Header>
        </Card.Header>
        <StyledProposalDescription>
          <ReactMarkdown source={description} linkTarget='_blank' />
        </StyledProposalDescription>
        <ProposalParams>
          <ParamsHeader>Parameters:</ParamsHeader>
          { Object.entries(parsedParams).map(([paramName, paramValue]) => (
            <ProposalParam key={paramName} fullWidth={paramValue instanceof FullWidthParam}>
              <ProposalParamName>{paramName}:</ProposalParamName>
              <ProposalParamValue>
                { paramValue instanceof FullWidthParam ? paramValue.value : paramValue}
              </ProposalParamValue>
            </ProposalParam>
          ))}
        </ProposalParams>
        { iAmProposer && isCancellable && (<>
          <Message warning active>
            <Message.Content>
              <Message.Header>Proposal cancellation</Message.Header>
              <p style={{ margin: '0.5em 0', padding: '0' }}>
                {'You can only cancel your proposal while it\'s still in the Voting Period.'}
              </p>
              <p style={{ margin: '0.5em 0', padding: '0' }}>
                The cancellation fee for this type of proposal is:&nbsp;
                <b>{ cancellationFee ? formatBalance(cancellationFee) : 'NONE' }</b>
              </p>
              <Button.Group color="red">
                <TxButton
                  params={ [proposerId, proposalId] }
                  tx={ 'proposalsEngine.cancelProposal' }
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
