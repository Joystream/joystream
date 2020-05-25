import React from "react";

export default function NotDone(props: any) {
  return (
    <>
      <h1>This is not implemented yet :( </h1>
      <div>however, here is your props.</div>
      <code>{JSON.stringify(props)}</code>
    </>
  );
}
