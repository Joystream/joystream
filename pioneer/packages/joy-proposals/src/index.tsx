import React from 'react';
import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Breadcrumb } from 'semantic-ui-react';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { TransportProvider } from '@polkadot/joy-utils/react/context';
import { ProposalPreviewList, ProposalFromId, ChooseProposalType } from './Proposal';
import _ from 'lodash';

import './index.css';

import translate from './translate';
import NotDone from './NotDone';
import {
  SignalForm,
  SpendingProposalForm,
  SetContentWorkingGroupLeadForm,
  SetContentWorkingGroupMintCapForm,
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
  TerminateWorkingGroupLeaderForm
} from './forms';

interface Props extends AppProps, I18nProps {}

const StyledHeader = styled.header`
  text-align: left;

  .ui.breadcrumb {
    padding: 1.4rem 0 0 .4rem;
    font-size: 1.4rem;
  }
`;

function App (props: Props): React.ReactElement<Props> {
  const { basePath } = props;

  return (
    <TransportProvider>
      <main className="proposal--App">
        <StyledHeader>
          <Breadcrumb>
            <Switch>
              <Route path={`${basePath}/new/:type`} render={props => (
                <>
                  <Breadcrumb.Section link as={Link} to={basePath}>Proposals</Breadcrumb.Section>
                  <Breadcrumb.Divider icon="right angle" />
                  <Breadcrumb.Section link as={Link} to={`${basePath}/new`}>New proposal</Breadcrumb.Section>
                  <Breadcrumb.Divider icon="right angle" />
                  <Breadcrumb.Section active>{_.startCase(props.match.params.type)}</Breadcrumb.Section>
                </>
              )} />
              <Route path={`${basePath}/new`}>
                <Breadcrumb.Section link as={Link} to={basePath}>Proposals</Breadcrumb.Section>
                <Breadcrumb.Divider icon="right angle" />
                <Breadcrumb.Section active>New proposal</Breadcrumb.Section>
              </Route>
              <Route>
                <Breadcrumb.Section active>Proposals</Breadcrumb.Section>
              </Route>
            </Switch>
          </Breadcrumb>
        </StyledHeader>
        <Switch>
          <Route exact path={`${basePath}/new`} component={ChooseProposalType} />
          <Route exact path={`${basePath}/new/text`} component={SignalForm} />
          <Route exact path={`${basePath}/new/runtime-upgrade`} component={RuntimeUpgradeForm} />
          <Route exact path={`${basePath}/new/set-election-parameters`} component={SetCouncilParamsForm} />
          <Route exact path={`${basePath}/new/spending`} component={SpendingProposalForm} />
          <Route exact path={`${basePath}/new/set-lead`} component={SetContentWorkingGroupLeadForm} />
          <Route
            exact
            path={`${basePath}/new/set-content-working-group-mint-capacity`}
            component={SetContentWorkingGroupMintCapForm}
          />
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
          <Route exact path={`${basePath}/:id`} component={ProposalFromId} />
          <Route component={ProposalPreviewList} />
        </Switch>
      </main>
    </TransportProvider>
  );
}

export default translate(App);
