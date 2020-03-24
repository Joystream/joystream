import React from "react";
import { css } from "@emotion/core";

type TableProps = {
  elements: object[];
};

export default function Table({ elements }: TableProps) {
  let columns = elements.map(el => Object.keys(el));

  return (
    <table>
      <thead>
        <tr
          css={css`
            & > th {
              text-align: center;
              white-space: nowrap;
              padding: 0.25rem 0.5rem;
              text-transform: lowercase;
            }
          `}
        >
          {columns[0].map(col => (
            // Splits the string on upper Case
            <th key={col}>{col.split(/(?=[A-Z])/).join(" ")}</th>
          ))}
        </tr>
      </thead>
      <tbody
        css={css`
          & td {
            padding: 0.25rem 0.5rem;
            text-align: left;
          }
          & tr:nth-child(2n) {
            background-color: white;
          }
          & tr:nth-child(2n + 1) {
            background-color: #eee;
          }
        `}
      >
        {elements.map(populateRow)}
      </tbody>
    </table>
  );
}

// ********************************

function populateRow(
  element: {
    [key: string]: any;
  },
  idx: number
) {
  return (
    <tr key={`row-${idx}`}>
      {Object.keys(element).map(elKey => (
        <td key={`${elKey}-${idx}`}>{element[elKey]}</td>
      ))}
    </tr>
  );
}
