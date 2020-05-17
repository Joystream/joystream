import React from "react"
import { Dropdown } from "./../src"

export default {
  title: "Dropdown",
  component: Dropdown,
}

const options = [
  {
    text: "Option 1",
    value: "1"
  },
  {
    text: "Option 2",
    value: "2"
  },
  {
    text: "Option 3",
    value: "3"
  }
]

export const Primary = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <Dropdown label="Label" options={options} />
  </div>
)

export const PrimaryWithValue = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <Dropdown label="Label" options={options} value={options[1].value} />
  </div>
)

export const PrimaryFocus = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <Dropdown label="Label" options={options} focus={true} />
  </div>
)

export const PrimaryError = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <Dropdown label="Label" options={options} error={true} />
  </div>
)
