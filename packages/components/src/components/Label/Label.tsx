import React from "react";

type LabelProps = {
  children?: React.ReactNode;
};

export default function Label({ children }: LabelProps) {
  return <div>{children}</div>;
}
