import React from 'react';
import { Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Breadcrumb } from 'semantic-ui-react';

import { AppProps, I18nProps } from '@polkadot/react-components/types';
import { TransportProvider } from '@polkadot/joy-utils/react/context';
import { ProposalPreviewList, ProposalFromId, ChooseProposalType } from './Proposal';

import './index.css';

import translate from './translate';
import NotDone from './NotDone';
import {
  SignalForm,
  EvictStorageProviderForm,
  SpendingProposalForm,
  SetContentWorkingGroupLeadForm,
  SetContentWorkingGroupMintCapForm,
  SetCouncilParamsForm,
  SetStorageRoleParamsForm,
  SetMaxValidatorCountForm,
  RuntimeUpgradeForm
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
          <Route exact path={`${basePath}/new/evict-storage-provider`} component={EvictStorageProviderForm} />
          <Route exact path={`${basePath}/new/set-validator-count`} component={SetMaxValidatorCountForm} />
          <Route exact path={`${basePath}/new/set-storage-role-parameters`} component={SetStorageRoleParamsForm} />
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
