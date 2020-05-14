import React from "react"
import { TextField } from "../src"

export default {
  title: "TextField",
  component: TextField,
}

export const Primary = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <TextField label="Label" />
  </div>
)

export const Focus = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <TextField label="Label" focus={true} />
  </div>
)

export const Error = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <TextField label="Label" error={true} />
  </div>
)