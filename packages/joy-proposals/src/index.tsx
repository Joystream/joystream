import React from "react";
import { Route, Switch } from "react-router";

import { AppProps, I18nProps } from "@polkadot/react-components/types";
import Tabs, { TabItem } from "@polkadot/react-components/Tabs";
import { ApiProps } from "@polkadot/react-api/types";

import "./index.css";

import translate from "./translate";
import NotDone from "./NotDone";

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
      name: "proposals/new",
      text: t("New Proposal")
    }
  ];

  return (
    <main className="proposal--App">
      <header>
        <Tabs basePath={basePath} items={tabs} />
      </header>
      <Switch>
        <Route path={`${basePath}/proposals/new`} component={NotDone} />
        <Route path={`${basePath}/active`} component={NotDone} />
        <Route path={`${basePath}/finalized`} component={NotDone} />
        <Route path={`${basePath}/new`} component={NotDone} />
        <Route path={`${basePath}/:id`} component={NotDone} />
        <Route component={NotDone} />
      </Switch>
    </main>
  );
}

export default translate(App);
