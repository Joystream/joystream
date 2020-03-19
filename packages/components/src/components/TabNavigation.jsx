import React from "react";
import { css } from "@emotion/core";

import TabLink from "./TabLink";

export default function TabNavigation({ links }) {
  return (
    <div
      css={css`
        display: flex;
        justify-content: space-evenly;
        border-bottom: 1px solid #eee;
      `}
    >
      {links.map(link => (
        <TabLink
          key={link.label}
          isSelected={link.isSelected}
          to={link.to}
          label={link.label}
        />
      ))}
    </div>
  );
}
