import React from "react";
import { css, SerializedStyles } from "@emotion/core";

type MainProps = {
	children: React.ReactNode;
	containerCss: SerializedStyles;
};
const Main: React.FC<Partial<MainProps>> = ({ children, containerCss }) => (
	<main
		css={[
			css`
				padding: 0 2rem;
			`,
			containerCss,
		]}
	>
		{children}
	</main>
);

export default Main;
