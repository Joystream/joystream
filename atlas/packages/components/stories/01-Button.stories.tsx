import React from "react"
import { Button } from "../src"
import { faBan } from "@fortawesome/free-solid-svg-icons"

export default {
  title: "Button",
  component: Button,
}

export const Primary = () => (
  <>
    <Button text="Button" onClick={() => console.log("Button clicked!")} />
    <Button text="Button" size="small" onClick={() => console.log("Button clicked!")} />
    <Button text="Button" size="smaller" onClick={() => console.log("Button clicked!")} />
  </>
)

export const Secondary = () => (
  <>
    <Button text="Button" type="secondary" />
    <Button text="Button" type="secondary" size="small" />
    <Button text="Button" type="secondary" size="smaller" />
  </>
)

export const PrimaryFullSize = () => (
  <Button text="Button" width="full" />
)

export const SecondaryFullSize = () => (
  <Button text="Button" width="full" type="secondary" />
)

export const PrimaryWithIcon = () => (
  <>
    <Button text="Button" icon={faBan} />
    <Button text="Button" icon={faBan} size="small" />
    <Button text="Button" icon={faBan} size="smaller" />
  </>
)

export const SecondaryWithIcon = () => (
  <>
    <Button text="Button" type="secondary" icon={faBan} />
    <Button text="Button" type="secondary" icon={faBan} size="small" />
    <Button text="Button" type="secondary" icon={faBan} size="smaller" />
  </>
)

export const PrimaryWithoutText = () => (
  <>
    <Button icon={faBan} />
    <Button icon={faBan} size="small" />
    <Button icon={faBan} size="smaller" />
  </>
)

export const SecondaryWithoutText = () => (
  <>
    <Button type="secondary" icon={faBan} />
    <Button type="secondary" icon={faBan} size="small" />
    <Button type="secondary" icon={faBan} size="smaller" />
  </>
)

export const Disabled = () => (
  <>
    <Button disabled={true} text="Button" onClick={() => console.log("Button clicked!")} />
    <Button disabled={true} text="Button" icon={faBan} onClick={() => console.log("Button clicked!")} />
    <Button disabled={true} icon={faBan} onClick={() => console.log("Button clicked!")} />
  </>
)