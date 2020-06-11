import React from "react";
import { css, Global } from "@emotion/core";
import emotionNormalize from "emotion-normalize";
import { theme } from "@joystream/components";

type LayoutProps = { children: React.ReactNode | React.ReactNode[] };

const globalStyles = css`
	${emotionNormalize};

	body {
		box-sizing: border-box;
		font-family: ${theme.typography.fonts.base};
		background: ${theme.colors.black};
		color: ${theme.colors.gray[500]};
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
export default function Layout({ children }: LayoutProps) {
	return (
		<>
			<Global styles={globalStyles} />
			{children}
		</>
	);
}
