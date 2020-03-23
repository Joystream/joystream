import React from "react";
import { css } from "@emotion/core";

import Link from "./Link";
import Card from "./Card";

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
    <Card>
      <header
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          white-space: nowrap;
          color: rgba(0, 0, 0, 0.6);

          & > div {
            font-weight: 100;
          }
        `}
      >
        <div
          css={css`
            font-size: 2.25rem;
            display: inline-block;
            margin-right: 0.5rem;
            color: rgb(46, 134, 171);
          `}
        >
          <Link to={``}>{blockNum}</Link>
        </div>
        <div
          css={css`
            font-size: 1.5rem;
            display: inline-block;
            text-overflow: ellipsis;
            overflow: hidden;
          `}
        >
          {hash}
        </div>
        <div>Copy</div>
      </header>
      {isExpanded && (
        <div
          css={css`
            display: flex;
            flex-direction: column;
            margin-top: 0.5rem;
            text-align: center;

            & > div {
              margin-bottom: 0.125rem;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
          `}
        >
          <div>
            <label
              css={css`
                margin-right: 0.5rem;
                min-width: 10rem;
                text-align: right;
                font-weight: 100;
              `}
            >
              parentHash
            </label>
            <span
              css={css`
                color: rgb(46, 134, 171);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-family: monospace;
              `}
            >
              {parentHash}
            </span>
          </div>
          <div>
            <label
              css={css`
                margin-right: 0.5rem;
                min-width: 10rem;
                text-align: right;
                font-weight: 100;
              `}
            >
              extrinsicsRoot
            </label>
            <span
              css={css`
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-family: monospace;
              `}
            >
              {extrinsictRoot}
            </span>
          </div>
          <div>
            <label
              css={css`
                margin-right: 0.5rem;
                min-width: 10rem;
                text-align: right;
                font-weight: 100;
              `}
            >
              stateRoot
            </label>
            <span
              css={css`
                overflow: hidden;
                text-overflow: ellipsis;
                font-family: monospace;
              `}
            >
              {stateRoot}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
