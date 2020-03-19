import React from "react";
import { css } from "@emotion/core";

import TabLink from "./TabLink";

export default function TabNavigation({ links, selected }) {
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-evenly;
        border-bottom: 1px solid #eee;
      `}
    >
      {links.map((link, idx) => (
        <TabLink
          key={link.label}
          isSelected={idx === selected}
          to={link.to}
          label={link.label}
        />
      ))}
    </div>
  );
}
