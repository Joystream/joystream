import React from "react";
import { Route, Switch } from "react-router";

import { AppProps, I18nProps } from "@polkadot/react-components/types";
import Tabs, { TabItem } from "@polkadot/react-components/Tabs";
import { SubstrateProvider } from "./runtime";
import { ProposalPreviewList, ProposalFromId, ChooseProposalType } from "./Proposal";

import "./index.css";

import translate from "./translate";
import NotDone from "./NotDone";
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
} from "./forms";

interface Props extends AppProps, I18nProps {}

function App(props: Props): React.ReactElement<Props> {
  const { t, basePath } = props;

  const tabs: TabItem[] = [
    {
      isRoot: true,
      name: "proposals",
      text: t("Proposals")
    },
    {
      name: "new",
      text: t("New Proposal")
    }
  ];

  return (
    <SubstrateProvider>
      <main className="proposal--App">
        <header>
          <Tabs basePath={basePath} items={tabs} />
        </header>

        <Switch>
          <Route exact component={ProposalPreviewList} />
          <Route exact path={`${basePath}/active`} component={NotDone} />
          <Route exact path={`${basePath}/finalized`} component={NotDone} />
          <Route exact path={`${basePath}/:id`} component={ProposalFromId} />
          <Route exact path={`${basePath}/new`} component={ChooseProposalType} />
          <Route path={`${basePath}/new/text`} component={SignalForm} />
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
        </Switch>
      </main>
    </SubstrateProvider>
  );
}

export default translate(App);
