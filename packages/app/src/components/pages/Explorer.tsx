import React, { useState } from "react";
import { TabNavigation, SearchBar } from "components";

let links = [
  {
    label: "Chain Info",
    to: "#",
  },
  {
    label: "Block Details",
    to: "#",
  },
  {
    label: "Forks",
    to: "#",
    isSelected: true,
  },
  {
    label: "Node Info",
    to: "#",
  },
];

export default function Explorer() {
  let [tab, setTab] = useState(0);
  return (
    <>
      <header>
        <TabNavigation selected={tab} links={links} />
        <SearchBar placeholder={"block hash or number to query..."} />
      </header>
      <main>
        <h1>Block Informations goes here...</h1>
      </main>
    </>
  );
}
