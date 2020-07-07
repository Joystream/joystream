import React from "react";
import { GlobalStyle } from "@joystream/components";

const Layout: React.FC = ({ children }) => (
	<main>
		<GlobalStyle />
		{children}
	</main>
);

export default Layout;
