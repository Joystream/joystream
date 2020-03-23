import React from "react";
import Card from "./Card";

type CardStackProps = {
  items: JSX.Element[];
};

export default function CardStack({ items }: CardStackProps) {
  return (
    <div>
      {items.map((item, key) => (
        <div key={key}>{item}</div>
      ))}
    </div>
  );
}
