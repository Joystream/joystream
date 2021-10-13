import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Header, Message, Icon } from 'semantic-ui-react';
import { ProposalType, ParsedProposalDetails, SpecificProposalDetails, RuntimeUpgradeProposalDetails } from '@polkadot/joy-utils/types/proposals';
import { bytesToString } from '@polkadot/joy-utils/functions/misc';
import styled from 'styled-components';
import AddressMini from '@polkadot/react-components/AddressMini';
import { SemanticTxButton } from '@polkadot/joy-utils/react/components/TxButton';
import { ProposalId, ProposalDetails } from '@joystream/types/proposals';
import { MemberId, Membership } from '@joystream/types/members';
import ProfilePreview from '@polkadot/joy-utils/react/components/MemberProfilePreview';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { Option } from '@polkadot/types/';
import { BlockNumber, Balance, AccountId } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import PromiseComponent from '@polkadot/joy-utils/react/components/PromiseComponent';
import ReactMarkdown from 'react-markdown';
import { StakingPolicy } from '@joystream/types/hiring';
import { WorkingGroup, WorkingGroupKey } from '@joystream/types/common';
import { ApplicationsDetailsByOpening } from '@polkadot/joy-utils/react/components/working-groups/ApplicationDetails';
import { LeadInfoFromId } from '@polkadot/joy-utils/react/components/working-groups/LeadInfo';
import { formatReward } from '@polkadot/joy-utils/functions/format';
import BN from 'bn.js';
import { WorkerId } from '@joystream/types/src/working-group';

type BodyProps = {
  title: string;
  description: string;
  params: ParsedProposalDetails;
  type: ProposalType;
  iAmProposer: boolean;
  proposalId: number | ProposalId;
  proposerId: number | MemberId;
  isCancellable: boolean;
  cancellationFee: number;
  historical?: boolean;
};

function ProposedAddress (props: { accountId?: AccountId }) {
  if (!props.accountId) {
    return <>NONE</>;
  }

  return (
    <AddressMini
      value={props.accountId.toString()}
      isShort={false}
      isPadded={false}
      withAddress={true}
      style={{ padding: 0 }} />
  );
}

function ProposedMember (props: { memberId: MemberId | number }) {
  const transport = useTransport();

  const [member, error, loading] = usePromise<Membership | null>(
    () => transport.members.membershipById(props.memberId),
    null
  );

  return (
    <PromiseComponent error={error} loading={loading} message='Fetching profile...'>
      { (member && !member.isEmpty) ? (
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
const paramParsers: { [k in ProposalType]: (params: SpecificProposalDetails<k>, historical?: boolean) => ParsedParam[]} = {
  Text: (content) => [
    new ParsedParam(
      'Content',
      <ReactMarkdown className='TextProposalContent' source={content.toString()} linkTarget='_blank' />,
      true
    )
  ],
  RuntimeUpgrade: ([hash, filesize]) => [
    new ParsedParam('Blake2b256 hash of WASM code', hash, true),
    new ParsedParam('File size', `${filesize} bytes`)
  ],
  SetElectionParameters: (params) => [
    new ParsedParam('Announcing period', `${params.announcing_period.toString()} blocks`),
    new ParsedParam('Voting period', `${params.voting_period.toString()} blocks`),
    new ParsedParam('Revealing period', `${params.revealing_period.toString()} blocks`),
    new ParsedParam('Council size', `${params.council_size.toString()} members`),
    new ParsedParam('Candidacy limit', `${params.candidacy_limit.toString()} members`),
    new ParsedParam('New term duration', `${params.new_term_duration.toString()} blocks`),
    new ParsedParam('Min. council stake', formatBalance(params.min_council_stake)),
    new ParsedParam('Min. voting stake', formatBalance(params.min_voting_stake))
  ],
  Spending: ([amount, account]) => [
    new ParsedParam('Amount', formatBalance(amount as Balance)),
    new ParsedParam('Account', <ProposedAddress accountId={account as AccountId} />)
  ],
  SetLead: (params) => [
    new ParsedParam(
      'Member',
      params.isSome ? <ProposedMember memberId={params.unwrap()[0] as MemberId} /> : 'NONE'
    ),
    new ParsedParam('Account id', <ProposedAddress accountId={params.unwrapOr([])[1] as AccountId | undefined} />)
  ],
  SetContentWorkingGroupMintCapacity: (capacity) => [
    new ParsedParam('Mint capacity', formatBalance(capacity))
  ],
  EvictStorageProvider: (accountId) => [
    new ParsedParam('Storage provider account', <ProposedAddress accountId={accountId} />)
  ],
  SetValidatorCount: (count) => [
    new ParsedParam('Validator count', count.toString())
  ],
  SetStorageRoleParameters: (params) => [
    new ParsedParam('Min. stake', formatBalance(params.min_stake)),
    // "Min. actors": params.min_actors,
    new ParsedParam('Max. actors', params.max_actors.toString()),
    new ParsedParam('Reward', formatBalance(params.reward)),
    new ParsedParam('Reward period', `${params.reward_period.toString()} blocks`),
    // "Bonding period": params.bonding_period + " blocks",
    new ParsedParam('Unbonding period', `${params.unbonding_period.toString()} blocks`),
    // "Min. service period": params.min_service_period + " blocks",
    // "Startup grace period": params.startup_grace_period + " blocks",
    new ParsedParam('Entry request fee', formatBalance(params.entry_request_fee))
  ],
  AddWorkingGroupLeaderOpening: ({
    activate_at: activateAt,
    commitment,
    human_readable_text: humanReadableText,
    working_group: workingGroup
  }) => {
    const activateAtBlock = activateAt.isOfType('ExactBlock') ? activateAt.asType('ExactBlock') : null;
    const {
      application_staking_policy: applicationSP,
      role_staking_policy: roleSP,
      application_rationing_policy: rationingPolicy
    } = commitment;
    let HRT = bytesToString(humanReadableText);

    try { HRT = JSON.stringify(JSON.parse(HRT), undefined, 4); } catch (e) { /* Do nothing */ }

    const formatStake = (stake: Option<StakingPolicy>) => (
      stake.isSome ? stake.unwrap().amount_mode.type + `(${stake.unwrap().amount.toString()})` : 'NONE'
    );
    const formatPeriod = (unstakingPeriod: Option<BlockNumber>) => (
      `${unstakingPeriod.unwrapOr(new BN(0)).toString()} blocks`
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
      new ParsedParam('Max. review period length', `${commitment.max_review_period_length.toString()} blocks`),
      new ParsedParam(
        'Terminate unstaking period (role stake)',
        formatPeriod(commitment.terminate_role_stake_unstaking_period)
      ),
      new ParsedParam(
        'Exit unstaking period (role stake)',
        formatPeriod(commitment.exit_role_stake_unstaking_period)
      ),
      // <required_to_prevent_sneaking>
      new ParsedParam(
        'Terminate unstaking period (appl. stake)',
        formatPeriod(commitment.terminate_application_stake_unstaking_period)
      ),
      new ParsedParam(
        'Exit unstaking period (appl. stake)',
        formatPeriod(commitment.exit_role_application_stake_unstaking_period)
      ),
      new ParsedParam(
        'Appl. accepted unstaking period (appl. stake)',
        formatPeriod(commitment.fill_opening_successful_applicant_application_stake_unstaking_period)
      ),
      new ParsedParam(
        'Appl. failed unstaking period (role stake)',
        formatPeriod(commitment.fill_opening_failed_applicant_role_stake_unstaking_period)
      ),
      new ParsedParam(
        'Appl. failed unstaking period (appl. stake)',
        formatPeriod(commitment.fill_opening_failed_applicant_application_stake_unstaking_period)
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
    new ParsedParam('Working group', (group as WorkingGroup).type),
    new ParsedParam('Mint capacity', formatBalance((capacity as Balance)))
  ],
  BeginReviewWorkingGroupLeaderApplication: ([id, group], historical) => [
    new ParsedParam('Working group', (group as WorkingGroup).type),
    // TODO: Adjust the link to work with multiple groups after working-groups are normalized!
    new ParsedParam(
      'Opening id',
      historical
        ? `#${id.toString()}`
        : <Link to={`/working-groups/opportunities/storageProviders/${id.toString()}`}>#{id.toString()}</Link>
    )
  ],
  FillWorkingGroupLeaderOpening: ({
    opening_id: openingId,
    successful_application_id: succesfulApplicationId,
    reward_policy: rewardPolicy,
    working_group: workingGroup
  }, historical) => [
    new ParsedParam('Working group', workingGroup.type),
    // TODO: Adjust the link to work with multiple groups after working-groups are normalized!
    new ParsedParam(
      'Opening id',
      historical
        ? `#${openingId.toString()}`
        : <Link to={`/working-groups/opportunities/storageProviders/${openingId.toString()}`}>#{openingId.toString()}</Link>),
    new ParsedParam('Reward policy', rewardPolicy.isSome ? formatReward(rewardPolicy.unwrap(), true) : 'NONE'),
    new ParsedParam(
      'Result',
      historical
        ? `Accepted application ID: ${succesfulApplicationId.toNumber()}`
        : <ApplicationsDetailsByOpening
          openingId={openingId.toNumber()}
          acceptedIds={[succesfulApplicationId.toNumber()]}
          group={workingGroup.type as WorkingGroupKey}/>,
      true
    )
  ],
  SlashWorkingGroupLeaderStake: ([leadId, amount, group], historical) => [
    new ParsedParam('Working group', (group as WorkingGroup).type),
    new ParsedParam('Slash amount', formatBalance(amount as Balance)),
    new ParsedParam(
      'Lead',
      historical
        ? `#${(leadId as WorkerId).toNumber()}`
        : <LeadInfoFromId group={(group as WorkingGroup).type as WorkingGroupKey} leadId={(leadId as WorkerId).toNumber()}/>,
      true
    )
  ],
  DecreaseWorkingGroupLeaderStake: ([leadId, amount, group], historical) => [
    new ParsedParam('Working group', (group as WorkingGroup).type),
    new ParsedParam('Decrease amount', formatBalance(amount as Balance)),
    new ParsedParam(
      'Lead',
      historical
        ? `#${(leadId as WorkerId).toNumber()}`
        : <LeadInfoFromId group={(group as WorkingGroup).type as WorkingGroupKey} leadId={(leadId as WorkerId).toNumber()}/>,
      true
    )
  ],
  SetWorkingGroupLeaderReward: ([leadId, amount, group], historical) => [
    new ParsedParam('Working group', (group as WorkingGroup).type),
    new ParsedParam('New reward amount', formatBalance(amount as Balance)),
    new ParsedParam(
      'Lead',
      historical
        ? `#${(leadId as WorkerId).toNumber()}`
        : <LeadInfoFromId group={(group as WorkingGroup).type as WorkingGroupKey} leadId={(leadId as WorkerId).toNumber()}/>,
      true
    )
  ],
  TerminateWorkingGroupLeaderRole: ({
    working_group: workingGroup,
    rationale,
    worker_id: leadId,
    slash
  },
  historical) => {
    return [
      new ParsedParam('Working group', workingGroup.type),
      new ParsedParam('Rationale', bytesToString(rationale), true),
      new ParsedParam('Slash stake', slash.isTrue ? 'YES' : 'NO'),
      new ParsedParam(
        'Lead',
        historical
          ? `#${leadId.toNumber()}`
          : <LeadInfoFromId group={workingGroup.type as WorkingGroupKey} leadId={leadId.toNumber()}/>,
        true
      )
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
  params,
  iAmProposer,
  proposalId,
  proposerId,
  isCancellable,
  cancellationFee,
  historical
}: BodyProps) {
  // Assert more generic type (since TypeScript cannot possibly know the value of "type" here yet)
  const parseParams = paramParsers[type] as (params: SpecificProposalDetails<ProposalType>, historical?: boolean) => ParsedParam[];
  const parsedParams = parseParams(
    type === 'RuntimeUpgrade'
      ? params as RuntimeUpgradeProposalDetails
      : (params as ProposalDetails).asType(type),
    historical
  );

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Header as='h1'>{title}</Header>
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
              <SemanticTxButton
                params={ [proposerId, proposalId] }
                tx={ 'proposalsEngine.cancelProposal' }
                onClick={ (sendTx) => { sendTx(); } }
                icon
                color={ 'red' }
                labelPosition={ 'left' }
              >
                <Icon name='cancel' inverted />
                Withdraw proposal
              </SemanticTxButton>
            </Message.Content>
          </Message>
        </>) }
      </Card.Content>
    </Card>
  );
}
