import React from 'react';
import { Route, Switch, RouteComponentProps } from 'react-router';
import Tabs from '@polkadot/react-components/Tabs';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Breadcrumb, Message } from 'semantic-ui-react';

import { I18nProps } from '@polkadot/react-components/types';
import { ProposalPreviewList, ProposalFromId, ChooseProposalType } from './Proposal';
import _ from 'lodash';

import translate from './translate';
import NotDone from './NotDone';
import { SignalForm,
  SpendingProposalForm,
  SetCouncilParamsForm,
  SetMaxValidatorCountForm,
  RuntimeUpgradeForm,
  AddWorkingGroupOpeningForm,
  SetWorkingGroupMintCapacityForm,
  BeginReviewLeaderApplicationsForm,
  FillWorkingGroupLeaderOpeningForm,
  DecreaseWorkingGroupLeadStakeFrom,
  SlashWorkingGroupLeadStakeForm,
  SetWorkingGroupLeadRewardForm,
  TerminateWorkingGroupLeaderForm } from './forms';
import { RouteProps as AppMainRouteProps } from '@polkadot/apps-routing/types';
import style from './style';
import { HistoricalProposalFromId } from './Proposal/ProposalFromId';

const ProposalsMain = styled.main`${style}`;

interface Props extends AppMainRouteProps, I18nProps {}

const StyledHeader = styled.header`
  text-align: left;

  .ui.breadcrumb {
    padding: 1.4rem 0 0 .4rem;
    font-size: 1.4rem;
  }
`;

const Banner = styled.div`
  height: 150px;
  display: flex;
  justify-content: center;
  margin: 0 -2em 15px -2em;
  align-items: center;
  border-bottom: 1px solid #ddd;
`;

const BannerText = styled.h1`
  font-size: 24px;
  color: black;
  width: 75%;
  text-align: center;
  font-weight: 600;

  @media(max-width: 1300px){
    font-size: 20px;
    width: 80%;
  }

  @media(max-width: 800px){
    font-size: 16px;
  }

  @media(max-width: 500px){
    font-size: 12px;
  }
`;

function App (props: Props): React.ReactElement<Props> {
  const { basePath, t } = props;
  const tabs = [
    {
      isRoot: true,
      name: 'current',
      text: t('Current')
    },
    {
      name: 'historical',
      text: t('Historical'),
      hasParams: true
    }
  ];

  return (
    <ProposalsMain className='proposal--App'>
      <Banner>
        <BannerText>
          By being an active contributor to the platform you are eligible to share your testnet contributions to have a chance at becoming a Founding Member.
          Make sure to do that to get a portion of the initial mainnet tokens and other interesting accolades. Get started <a href='https://www.joystream.org/founding-members' target='_blank' rel='noreferrer'>here</a>!
        </BannerText>
      </Banner>
      <StyledHeader>
        <Tabs
          basePath={basePath}
          items={tabs}
        />
        <Breadcrumb>
          <Switch>
            <Route path={`${basePath}/new/:type`} render={(props: RouteComponentProps<{ type?: string }>) => (
              <>
                <Breadcrumb.Section link as={Link} to={basePath}>Proposals</Breadcrumb.Section>
                <Breadcrumb.Divider icon='right angle' />
                <Breadcrumb.Section link as={Link} to={`${basePath}/new`}>New proposal</Breadcrumb.Section>
                <Breadcrumb.Divider icon='right angle' />
                <Breadcrumb.Section active>{_.startCase(props.match.params.type)}</Breadcrumb.Section>
              </>
            )} />
            <Route path={`${basePath}/new`}>
              <Breadcrumb.Section link as={Link} to={basePath}>Proposals</Breadcrumb.Section>
              <Breadcrumb.Divider icon='right angle' />
              <Breadcrumb.Section active>New proposal</Breadcrumb.Section>
            </Route>
            <Route path={`${basePath}/historical`}>
              <Breadcrumb.Section active>Historical Proposals</Breadcrumb.Section>
            </Route>
            <Route>
              <Breadcrumb.Section active>Proposals</Breadcrumb.Section>
            </Route>
          </Switch>
        </Breadcrumb>
        <Switch>
          <Route path={`${basePath}/historical`}>
            <Message warning active>
              <Message.Header>{"You're in a historical proposals view."}</Message.Header>
              <Message.Content>
                The data presented here comes from previous Joystream testnet chain, which
                means all proposals are read-only and can no longer be interacted with!
              </Message.Content>
            </Message>
          </Route>
        </Switch>
      </StyledHeader>
      <Switch>
        <Route exact path={`${basePath}/new`} component={ChooseProposalType} />
        <Route exact path={`${basePath}/new/text`} component={SignalForm} />
        <Route exact path={`${basePath}/new/runtime-upgrade`} component={RuntimeUpgradeForm} />
        <Route exact path={`${basePath}/new/set-election-parameters`} component={SetCouncilParamsForm} />
        <Route exact path={`${basePath}/new/spending`} component={SpendingProposalForm} />
        <Route exact path={`${basePath}/new/set-validator-count`} component={SetMaxValidatorCountForm} />
        <Route exact path={`${basePath}/new/add-working-group-leader-opening`} component={AddWorkingGroupOpeningForm} />
        <Route exact path={`${basePath}/new/set-working-group-mint-capacity`} component={SetWorkingGroupMintCapacityForm} />
        <Route exact path={`${basePath}/new/begin-review-working-group-leader-application`} component={BeginReviewLeaderApplicationsForm} />
        <Route exact path={`${basePath}/new/fill-working-group-leader-opening`} component={FillWorkingGroupLeaderOpeningForm} />
        <Route exact path={`${basePath}/new/decrease-working-group-leader-stake`} component={DecreaseWorkingGroupLeadStakeFrom} />
        <Route exact path={`${basePath}/new/slash-working-group-leader-stake`} component={SlashWorkingGroupLeadStakeForm} />
        <Route exact path={`${basePath}/new/set-working-group-leader-reward`} component={SetWorkingGroupLeadRewardForm} />
        <Route exact path={`${basePath}/new/terminate-working-group-leader-role`} component={TerminateWorkingGroupLeaderForm} />
        <Route exact path={`${basePath}/active`} component={NotDone} />
        <Route exact path={`${basePath}/finalized`} component={NotDone} />
        <Route exact path={`${basePath}/historical`} render={() => <ProposalPreviewList historical={true}/>} />
        <Route exact path={`${basePath}/historical/:id`} component={HistoricalProposalFromId}/>
        <Route exact path={`${basePath}/:id`} component={ProposalFromId}/>
        <Route component={ProposalPreviewList} />
      </Switch>
    </ProposalsMain>
  );
}

export default translate(App);
