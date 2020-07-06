import React from "react";
import { css, Global } from "@emotion/core";
import emotionNormalize from "emotion-normalize";
import { theme } from "@joystream/components";

const globalStyles = css`
	${emotionNormalize};

	body {
		font-family: ${theme.typography.fonts.base};
		background: ${theme.colors.black};
		color: ${theme.colors.gray[500]};
	}

	*,
	*::after,
	*::before {
		box-sizing: border-box;
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-family: ${theme.typography.fonts.headers};
		color: ${theme.colors.white};
	}
`;

const Layout: React.FC = ({ children }) => (
	<main>
		<Global styles={globalStyles} />
		{children}
	</main>
);

export default Layout;
