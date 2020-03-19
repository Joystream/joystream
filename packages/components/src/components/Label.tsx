import React from "react";
import ContentLabel from "./ContentLabel";

type ContentLabelProps = {
  type: string;
  label: string;
  data: string | number;
  maxProgress: number;
};

export default function Label({
  type,
  label,
  data,
  maxProgress,
}: ContentLabelProps) {
  if (type === "progress" && typeof data === "number") {
    return (
      <ContentLabel
        label={label}
        data={data}
        withProgress={true}
        maxProgress={maxProgress}
      />
    );
  }
  return <ContentLabel label={label} data={data} />;
}
