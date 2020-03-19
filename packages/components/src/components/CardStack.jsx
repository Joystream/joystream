import React from "react";
import Card from "./Card";

export default function CardStack({ items }) {
  return (
    <>
      {items.map((item, key) => (
        <Card key={key}>{item}</Card>
      ))}
    </>
  );
}
