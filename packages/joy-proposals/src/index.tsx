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
  SetCouncilMintCapForm,
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
          <Route path={`${basePath}/new/text`} component={SignalForm} />
          <Route exact path={`${basePath}/new/evict-storage-provider`} component={EvictStorageProviderForm} />
          <Route exact path={`${basePath}/new/spending`} component={SpendingProposalForm} />
          <Route
            exact
            path={`${basePath}/new/set-content-working-group-lead`}
            component={SetContentWorkingGroupLeadForm}
          />
          <Route path={`${basePath}/new/set-cwg-mint-cap`} component={SetContentWorkingGroupMintCapForm} />
          <Route path={`${basePath}/new/set-council-mint-cap`} component={SetCouncilMintCapForm} />
          <Route path={`${basePath}/new/set-election-params`} component={SetCouncilParamsForm} />
          <Route path={`${basePath}/new/set-max-validator-count`} component={SetMaxValidatorCountForm} />
          <Route path={`${basePath}/new/runtime-upgrade`} component={RuntimeUpgradeForm} />
          <Route path={`${basePath}/new`} component={ChooseProposalType} />
          <Route path={`${basePath}/active`} component={NotDone} />
          <Route path={`${basePath}/finalized`} component={NotDone} />
          <Route path={`${basePath}/:id`} component={ProposalFromId} />
          <Route component={ProposalPreviewList} />
        </Switch>
      </main>
    </SubstrateProvider>
  );
}

export default translate(App);
