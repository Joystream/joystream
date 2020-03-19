import React from "react";
import DataLabel from "./ContentLabel";

export default function Label({ type, label, data }) {
  if (type === "progress" && typeof data === "number") {
    return <DataLabel label={label} data={data} withProgress={true} />;
  }
  return <DataLabel label={label} data={data} />;
}
