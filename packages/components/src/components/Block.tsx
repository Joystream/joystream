import React from "react";
import { css } from "@emotion/core";

type BlockProps = {
  blockNum: number;
  hash: number | string;
  parentHash: number | string;
  stateRoot: number | string;
  extrinsictRoot: number | string;
  isExpanded?: boolean;
};
export default function Block({
  blockNum,
  hash,
  parentHash,
  stateRoot,
  extrinsictRoot,
  isExpanded = false,
}: BlockProps) {
  return (
    <article
      css={css`
        text-align: left;
      `}
    >
      <header
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-around;
        `}
      >
        <span
          css={css`
            font-size: 2.25rem;
            color: rgb(46, 134, 171);
          `}
        >
          {blockNum}
        </span>
        <h2>{hash}</h2>
        <div>Copy</div>
      </header>
      {isExpanded && (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            text-align: center;
            margin: 0.5rem auto;
          `}
        >
          <div>
            <span
              css={css`
                color: rgb(46, 134, 171);
                margin-right: 8px;
              `}
            >
              Parent Hash:
            </span>
            <span>{parentHash}</span>
          </div>
          <div>
            <span
              css={css`
                color: rgb(46, 134, 171);
                margin-right: 8px;
              `}
            >
              Extrinsict Root:
            </span>
            <span>{extrinsictRoot}</span>
          </div>
          <div>
            <span
              css={css`
                color: rgb(46, 134, 171);
                margin-right: 8px;
              `}
            >
              State Root:
            </span>
            <span>{stateRoot}</span>
          </div>
        </div>
      )}
    </article>
  );
}
