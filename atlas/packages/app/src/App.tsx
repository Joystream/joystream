import React from "react";
import { Router } from "@reach/router";
import { Provider } from "react-redux";

import store from "./store";
import data from "../staticData";

let { channels, videos } = data;

export default function App() {
	return (
		<main className="main-section">
			<Provider store={store}>
				<h1>Hello Atlas</h1>
			</Provider>
		</main>
	);
}
