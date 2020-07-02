import React from "react";
import { css } from "@emotion/core";
import { addDecorator, addParameters } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { jsxDecorator } from "storybook-addon-jsx";
import { Layout } from "app/src/components";
import theme from "./theme";

const wrapperStyle = css`
	padding: 10px;
`;

const stylesWrapperDecorator = (styleFn) => (
	<div css={wrapperStyle}>
		<Layout>{styleFn()}</Layout>
	</div>
);

addDecorator(withKnobs);
addDecorator(jsxDecorator);
addDecorator(stylesWrapperDecorator);

addParameters({
	options: {
		theme: theme,
	},
});
