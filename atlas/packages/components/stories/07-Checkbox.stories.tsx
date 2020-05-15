import React from "react"
import { Checkbox } from "../src"

export default {
	title: "Checkbox",
	component: Checkbox
}

export const Unselected = () => (
	<div style={{ background: "black", padding: "4rem", display: "flex", justifyContent: "space-around" }}>
		<Checkbox state="unselected" />
		<Checkbox state="unselected" icon="dash" />
		<Checkbox state="unselected" />
	</div>
)
export const Selected = () => (
	<div style={{ background: "black", padding: "4rem", display: "flex", justifyContent: "space-around" }}>
		<Checkbox state="selected" />
		<Checkbox state="selected" icon="dash" />
		<Checkbox state="selected" />
	</div>
)
export const Error = () => (
	<div style={{ background: "black", padding: "4rem", display: "flex", justifyContent: "space-around" }}>
		<Checkbox state="error" />
		<Checkbox state="error" />
		<Checkbox state="error" />
	</div>
)

export const Disabled = () => (
	<div style={{ background: "black", padding: "4rem", display: "flex", justifyContent: "space-around" }}>
		<Checkbox disabled state="error" />
		<Checkbox disabled state="selected" pressed />
		<Checkbox disabled state="unselected" />
	</div>
)
