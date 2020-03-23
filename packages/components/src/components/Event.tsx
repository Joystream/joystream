import React from "react";
import { css } from "@emotion/core";

import Card from "./Card";

type EventProps = {
  title: string;
  summary: string;
};
export default function Event({ title, summary }: EventProps) {
  return (
    <Card>
      <header>
        <h3>{title}</h3>
      </header>
      <div>
        <details
          css={css`
            & > summary {
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              outline: currentColor none medium;
              cursor: pointer;
            }
          `}
        >
          <summary
            css={css`
              display: list-item;
            `}
          >
            {summary}
          </summary>
        </details>
      </div>
    </Card>
  );
}
