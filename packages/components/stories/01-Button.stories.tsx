import React from "react"
import { Button } from "../src/"

export default {
  title: "Button",
  component: Button,
}

export const Primary = () => (
  <Button>Play</Button>
)

export const Secondary = () => (
  <Button type="secondary">Play</Button>
)

export const PrimaryFullSize = () => (
  <Button size="full">Load More</Button>
)

export const SecondaryFullSize = () => (
  <Button size="full" type="secondary">Load More</Button>
)
