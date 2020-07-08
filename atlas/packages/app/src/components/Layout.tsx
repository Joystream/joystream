import React from "react";
import { GlobalStyle } from "shared/components";

const Layout: React.FC = ({ children }) => (
	<main>
		<GlobalStyle />
		{children}
	</main>
);

export default Layout;
