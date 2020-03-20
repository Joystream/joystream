import React from "react";
import Card from "./Card";

type CardStackProps = {
  items: JSX.Element[];
};

export default function CardStack({ items }: CardStackProps) {
  return (
    <>
      {items.map((item, key) => (
        <Card key={key}>{item}</Card>
      ))}
    </>
  );
}
