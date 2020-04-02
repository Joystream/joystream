import React from "react";
import { DetailsTableStyleProps, makeStyles } from "./DetailsTable.style";

type DetailsTableProps = {
  details: {
    [k: string]: any;
  };
} & DetailsTableStyleProps;

export default function DetailsTable({
  details,
  ...styleProps
}: DetailsTableProps) {
  let styles = makeStyles(styleProps);
  let detailKeys = Object.keys(details);
  return (
    <table css={styles.table}>
      <tbody>
        {detailKeys.map(detailKey => (
          <tr key={detailKey} css={styles.row}>
            <td css={styles.key}>{detailKey}</td>
            <td css={styles.value}>{details[detailKey]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
