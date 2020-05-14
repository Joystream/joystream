import React from "react"
import { TextField } from "../src"
import { faBan } from "@fortawesome/free-solid-svg-icons"

export default {
  title: "TextField",
  component: TextField,
}

export const Primary = () => (
  <div style={{ backgroundColor: "black", padding: "50px 20px" }}>
    <TextField label="Label" />
  </div>
)
