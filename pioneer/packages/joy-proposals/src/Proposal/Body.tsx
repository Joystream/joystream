import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Header, Button, Icon, Message } from 'semantic-ui-react';
import { ProposalType } from '@polkadot/joy-utils/types/proposals';
import { bytesToString } from '@polkadot/joy-utils/functions/misc';
import styled from 'styled-components';
import AddressMini from '@polkadot/react-components/AddressMiniJoy';
import TxButton from '@polkadot/joy-utils/TxButton';
import { ProposalId, TerminateRoleParameters } from '@joystream/types/proposals';
import { MemberId, Membership } from '@joystream/types/members';
import ProfilePreview from '@polkadot/joy-utils/MemberProfilePreview';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { Option, Bytes } from '@polkadot/types/';
import { BlockNumber } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import ReactMarkdown from 'react-markdown';
import { WorkingGroupOpeningPolicyCommitment, RewardPolicy } from '@joystream/types/working-group';
import {
  ActivateOpeningAt,
  ActivateOpeningAtKeys,
  StakingPolicy
} from '@joystream/types/hiring';
import { WorkingGroup, WorkingGroupKey } from '@joystream/types/common';
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
  const [member, error, loading] = usePromise<Membership | null>(
    () => transport.members.membershipById(memberId),
    null
  );

  return (
    <PromiseComponent error={error} loading={loading} message="Fetching profile...">
      { (member && !member.handle.isEmpty) ? (
        <ProfilePreview
          avatar_uri={ member.avatar_uri.toString() }
          root_account={ member.root_account.toString() }
          handle={ member.handle.toString() }
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

class ParsedParam {
  name: string;
  value: ParsedParamValue;
  fullWidth: boolean;

  constructor (name: string, value: ParsedParamValue, fullWidth = false) {
    this.name = name;
    this.value = value;
    this.fullWidth = fullWidth;
  }
}

// The methods for parsing params by Proposal type.
const paramParsers: { [x in ProposalType]: (params: any[]) => ParsedParam[]} = {
  Text: ([content]) => [
    new ParsedParam(
      'Content',
      <ReactMarkdown className='TextProposalContent' source={content} linkTarget='_blank' />,
      true
    )
  ],
  RuntimeUpgrade: ([hash, filesize]) => [
    new ParsedParam('Blake2b256 hash of WASM code', hash, true),
    new ParsedParam('File size', filesize + ' bytes')
  ],
  SetElectionParameters: ([params]) => [
    new ParsedParam('Announcing period', params.announcing_period + ' blocks'),
    new ParsedParam('Voting period', params.voting_period + ' blocks'),
    new ParsedParam('Revealing period', params.revealing_period + ' blocks'),
    new ParsedParam('Council size', params.council_size + ' members'),
    new ParsedParam('Candidacy limit', params.candidacy_limit + ' members'),
    new ParsedParam('New term duration', params.new_term_duration + ' blocks'),
    new ParsedParam('Min. council stake', formatBalance(params.min_council_stake)),
    new ParsedParam('Min. voting stake', formatBalance(params.min_voting_stake))
  ],
  Spending: ([amount, account]) => [
    new ParsedParam('Amount', formatBalance(amount)),
    new ParsedParam('Account', <ProposedAddress address={account} />)
  ],
  SetLead: ([memberId, accountId]) => [
    new ParsedParam('Member', <ProposedMember memberId={ memberId } />),
    new ParsedParam('Account id', <ProposedAddress address={accountId} />)
  ],
  SetContentWorkingGroupMintCapacity: ([capacity]) => [
    new ParsedParam('Mint capacity', formatBalance(capacity))
  ],
  EvictStorageProvider: ([accountId]) => [
    new ParsedParam('Storage provider account', <ProposedAddress address={accountId} />)
  ],
  SetValidatorCount: ([count]) => [
    new ParsedParam('Validator count', count)
  ],
  SetStorageRoleParameters: ([params]) => [
    new ParsedParam('Min. stake', formatBalance(params.min_stake)),
    // "Min. actors": params.min_actors,
    new ParsedParam('Max. actors', params.max_actors),
    new ParsedParam('Reward', formatBalance(params.reward)),
    new ParsedParam('Reward period', params.reward_period + ' blocks'),
    // "Bonding period": params.bonding_period + " blocks",
    new ParsedParam('Unbonding period', params.unbonding_period + ' blocks'),
    // "Min. service period": params.min_service_period + " blocks",
    // "Startup grace period": params.startup_grace_period + " blocks",
    new ParsedParam('Entry request fee', formatBalance(params.entry_request_fee))
  ],
  AddWorkingGroupLeaderOpening: ([{ activate_at, commitment, human_readable_text, working_group }]) => {
    const workingGroup = new WorkingGroup(working_group);
    const activateAt = new ActivateOpeningAt(activate_at);
    const activateAtBlock = activateAt.type === ActivateOpeningAtKeys.ExactBlock ? activateAt.value : null;
    const OPCommitment = new WorkingGroupOpeningPolicyCommitment(commitment);
    const {
      application_staking_policy: applicationSP,
      role_staking_policy: roleSP,
      application_rationing_policy: rationingPolicy
    } = OPCommitment;
    let HRT = bytesToString(new Bytes(human_readable_text));
    try { HRT = JSON.stringify(JSON.parse(HRT), undefined, 4); } catch (e) { /* Do nothing */ }
    const formatStake = (stake: Option<StakingPolicy>) => (
      stake.isSome ? stake.unwrap().amount_mode.type + `(${stake.unwrap().amount})` : 'NONE'
    );
    const formatPeriod = (unstakingPeriod: Option<BlockNumber>) => (
      unstakingPeriod.unwrapOr(0) + ' blocks'
    );
    return [
      new ParsedParam('Working group', workingGroup.type),
      new ParsedParam('Activate at', `${activateAt.type}${activateAtBlock ? `(${activateAtBlock.toString()})` : ''}`),
      new ParsedParam('Application stake', formatStake(applicationSP)),
      new ParsedParam('Role stake', formatStake(roleSP)),
      new ParsedParam(
        'Max. applications',
        rationingPolicy.isSome ? rationingPolicy.unwrap().max_active_applicants.toNumber() : 'UNLIMITED'
      ),
      new ParsedParam(
        'Terminate unstaking period (role stake)',
        formatPeriod(OPCommitment.terminate_role_stake_unstaking_period)
      ),
      new ParsedParam(
        'Exit unstaking period (role stake)',
        formatPeriod(OPCommitment.exit_role_stake_unstaking_period)
      ),
      // <required_to_prevent_sneaking>
      new ParsedParam(
        'Terminate unstaking period (appl. stake)',
        formatPeriod(OPCommitment.terminate_application_stake_unstaking_period)
      ),
      new ParsedParam(
        'Exit unstaking period (appl. stake)',
        formatPeriod(OPCommitment.exit_role_application_stake_unstaking_period)
      ),
      new ParsedParam(
        'Appl. accepted unstaking period (appl. stake)',
        formatPeriod(OPCommitment.fill_opening_successful_applicant_application_stake_unstaking_period)
      ),
      new ParsedParam(
        'Appl. failed unstaking period (role stake)',
        formatPeriod(OPCommitment.fill_opening_failed_applicant_role_stake_unstaking_period)
      ),
      new ParsedParam(
        'Appl. failed unstaking period (appl. stake)',
        formatPeriod(OPCommitment.fill_opening_failed_applicant_application_stake_unstaking_period)
      ),
      new ParsedParam(
        'Crowded out unstaking period (role stake)',
        roleSP.isSome ? formatPeriod(roleSP.unwrap().crowded_out_unstaking_period_length) : '0 blocks'
      ),
      new ParsedParam(
        'Review period expierd unstaking period (role stake)',
        roleSP.isSome ? formatPeriod(roleSP.unwrap().review_period_expired_unstaking_period_length) : '0 blocks'
      ),
      new ParsedParam(
        'Crowded out unstaking period (appl. stake)',
        applicationSP.isSome ? formatPeriod(applicationSP.unwrap().crowded_out_unstaking_period_length) : '0 blocks'
      ),
      new ParsedParam(
        'Review period expierd unstaking period (appl. stake)',
        applicationSP.isSome ? formatPeriod(applicationSP.unwrap().review_period_expired_unstaking_period_length) : '0 blocks'
      ),
      // </required_to_prevent_sneaking>
      new ParsedParam('Human readable text', <ParsedHRT>{ HRT }</ParsedHRT>, true)
    ];
  },
  SetWorkingGroupMintCapacity: ([capacity, group]) => [
    new ParsedParam('Working group', (new WorkingGroup(group)).type),
    new ParsedParam('Mint capacity', formatBalance(capacity))
  ],
  BeginReviewWorkingGroupLeaderApplication: ([id, group]) => [
    new ParsedParam('Working group', (new WorkingGroup(group)).type),
    // TODO: Adjust the link to work with multiple groups after working-groups are normalized!
    new ParsedParam('Opening id', <Link to={`/working-groups/opportunities/storageProviders/${id}`}>#{id}</Link>)
  ],
  FillWorkingGroupLeaderOpening: ([params]) => {
    const { opening_id, successful_application_id, reward_policy, working_group } = params;
    const rewardPolicy = reward_policy && new RewardPolicy(reward_policy);
    return [
      new ParsedParam('Working group', (new WorkingGroup(working_group)).type),
      // TODO: Adjust the link to work with multiple groups after working-groups are normalized!
      new ParsedParam('Opening id', <Link to={`/working-groups/opportunities/storageProviders/${opening_id}`}>#{opening_id}</Link>),
      new ParsedParam('Reward policy', rewardPolicy ? formatReward(rewardPolicy, true) : 'NONE'),
      new ParsedParam(
        'Result',
        <ApplicationsDetailsByOpening
          openingId={opening_id}
          acceptedIds={[successful_application_id]}
          group={(new WorkingGroup(working_group)).type as WorkingGroupKey}/>,
        true
      )
    ];
  },
  SlashWorkingGroupLeaderStake: ([leadId, amount, group]) => [
    new ParsedParam('Working group', (new WorkingGroup(group)).type),
    new ParsedParam('Slash amount', formatBalance(amount)),
    new ParsedParam('Lead', <LeadInfoFromId group={(new WorkingGroup(group).type as WorkingGroupKey)} leadId={leadId}/>, true)
  ],
  DecreaseWorkingGroupLeaderStake: ([leadId, amount, group]) => [
    new ParsedParam('Working group', (new WorkingGroup(group)).type),
    new ParsedParam('Decrease amount', formatBalance(amount)),
    new ParsedParam('Lead', <LeadInfoFromId group={(new WorkingGroup(group).type as WorkingGroupKey)} leadId={leadId}/>, true)
  ],
  SetWorkingGroupLeaderReward: ([leadId, amount, group]) => [
    new ParsedParam('Working group', (new WorkingGroup(group)).type),
    new ParsedParam('New reward amount', formatBalance(amount)),
    new ParsedParam('Lead', <LeadInfoFromId group={(new WorkingGroup(group).type as WorkingGroupKey)} leadId={leadId}/>, true)
  ],
  TerminateWorkingGroupLeaderRole: ([params]) => {
    const paramsObj = new TerminateRoleParameters(params);
    const { working_group: workingGroup, rationale, worker_id: leadId, slash } = paramsObj;
    return [
      new ParsedParam('Working group', workingGroup.type),
      new ParsedParam('Rationale', bytesToString(rationale), true),
      new ParsedParam('Slash stake', slash.isTrue ? 'YES' : 'NO'),
      new ParsedParam('Lead', <LeadInfoFromId group={workingGroup.type as WorkingGroupKey} leadId={leadId.toNumber()}/>, true)
    ];
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
          { parsedParams.map(({ name, value, fullWidth }) => (
            <ProposalParam key={name} fullWidth={fullWidth}>
              <ProposalParamName>{name}:</ProposalParamName>
              <ProposalParamValue>{value}</ProposalParamValue>
            </ProposalParam>
          ))}
        </ProposalParams>
        { iAmProposer && isCancellable && (<>
          <Message warning visible>
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
