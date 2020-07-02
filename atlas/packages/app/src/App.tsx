import React from "react";
import { Provider } from "react-redux";
import { Router } from "@reach/router";

import store from "./store";
import { Layout } from "./components";
import HomeView from "app/src/views/HomeView";

export default function App() {
	return (
		<main>
			<Provider store={store}>
				<Layout>
					<Router primary={false}>
						<HomeView default />
					</Router>
				</Layout>
			</Provider>
		</main>
	);
}
