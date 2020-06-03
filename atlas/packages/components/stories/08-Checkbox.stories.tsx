import React, { useState } from "react";
import { Checkbox } from "./../src";

export default {
	title: "Checkbox",
	component: Checkbox,
};

export const Primary = () => {
	const [selected, setSelected] = useState(false);
	return (
		<div style={{ padding: "50px 20px", background: "black" }}>
			<Checkbox
				selected={selected}
				onChange={() => {
					setSelected(!selected);
				}}
			/>
		</div>
	);
};

export const PrimaryWithDash = () => {
	const [selected, setSelected] = useState(false);
	return (
		<div style={{ padding: "50px 20px", background: "black" }}>
			<Checkbox
				icon="dash"
				selected={selected}
				onChange={() => {
					setSelected(!selected);
				}}
			/>
		</div>
	);
};

export const Error = () => {
	const [selected, setSelected] = useState(false);
	return (
		<div style={{ padding: "50px 20px", background: "black" }}>
			<Checkbox
				selected={selected}
				error
				onChange={() => {
					setSelected(!selected);
				}}
			/>
		</div>
	);
};

export const ErrorWithDash = () => {
	const [selected, setSelected] = useState(false);
	return (
		<div style={{ padding: "50px 20px", background: "black" }}>
			<Checkbox
				selected={selected}
				error
				icon="dash"
				onChange={() => {
					setSelected(!selected);
				}}
			/>
		</div>
	);
};

export const Disabled = () => {
	const [selected, setSelected] = useState(false);
	return (
		<div style={{ padding: "50px 20px", background: "black" }}>
			<Checkbox
				disabled
				onChange={() => {
					setSelected(!selected);
				}}
				selected={selected}
			/>
			<Checkbox disabled icon="check" selected />
			<Checkbox disabled icon="dash" selected />
		</div>
	);
};
