import React, { useState } from "react";
import { Router, Link } from "@reach/router";
import { TabNavigation, SearchBar } from "components";

import ChainInfo from "../../components/ChainInfo";
import BlockDetails from "../../components/BlockDetails";
import "./explorer.css";

let links = [
  <Link to="/">Chain Info</Link>,
  <Link to="/query">Block Details </Link>,
  <Link to="/forks">Forks</Link>,
  <Link to="/node">Node info</Link>,
];

export default function Explorer() {
  let [tab, setTab] = useState(0);
  return (
    <>
      <header>
        <TabNavigation
          selected={tab}
          links={links}
          onClick={(n: number) => setTab(n)}
        />
        <div className="explorer-searchbar">
          <SearchBar placeholder="block hash or number to query" value="" />
        </div>
      </header>
      <main className="explorer-main">
        <Router>
          <ChainInfo path="/" />
          <BlockDetails path="/query" />
          <ChainInfo path="/forks" />
          <ChainInfo path="/node" />
        </Router>
      </main>
    </>
  );
}
