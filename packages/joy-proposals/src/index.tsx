import React from "react";
import { Route, Switch } from "react-router";

import { AppProps, I18nProps } from "@polkadot/react-components/types";
import Tabs, { TabItem } from "@polkadot/react-components/Tabs";

import "./index.css";

import translate from "./translate";
import NotDone from "./NotDone";
import {
  SignalForm,
  EvictStorageProviderForm,
  SpendingProposalForm,
  SetContentWorkingGroupLeadForm,
  SetContentWorkingGroupMintCapForm,
  SetCouncilMintCapForm,
  SetCouncilParamsForm,
  SetStorageRoleParamsForm,
  SetMaxValidatorCountForm,
  RuntimeUpgradeForm
} from "./forms";

interface Props extends AppProps, I18nProps {}

function App(props: Props): React.ReactElement<Props> {
  const { t, basePath } = props;

  // TODO: Can use semantic here?
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
    <main className="proposal--App">
      <header>
        <Tabs basePath={basePath} items={tabs} />
      </header>
      <Switch>
        <Route path={`${basePath}/new`} component={NotDone} />
        <Route path={`${basePath}/active`} component={NotDone} />
        <Route path={`${basePath}/finalized`} component={NotDone} />
        <Route path={`${basePath}/create/signal`} component={SignalForm} />
        <Route path={`${basePath}/create/evict-storage-provider`} component={EvictStorageProviderForm} />
        <Route path={`${basePath}/create/spending`} component={SpendingProposalForm} />
        <Route path={`${basePath}/create/set-cwg-lead`} component={SetContentWorkingGroupLeadForm} />
        <Route path={`${basePath}/create/set-cwg-mint-cap`} component={SetContentWorkingGroupMintCapForm} />
        <Route path={`${basePath}/create/set-council-mint-cap`} component={SetCouncilMintCapForm} />
        <Route path={`${basePath}/create/set-election-params`} component={SetCouncilParamsForm} />
        <Route path={`${basePath}/create/set-storage-role-params`} component={SetStorageRoleParamsForm} />
        <Route path={`${basePath}/create/set-max-validator-count`} component={SetMaxValidatorCountForm} />
        <Route path={`${basePath}/create/runtime-upgrade`} component={RuntimeUpgradeForm} />
        <Route path={`${basePath}/:id`} component={NotDone} />
        <Route component={NotDone} />
      </Switch>
    </main>
  );
}

export default translate(App);
