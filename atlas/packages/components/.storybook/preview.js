import { addDecorator, addParameters } from "@storybook/react";
import { withKnobs } from "@storybook/addon-knobs";
import { jsxDecorator } from "storybook-addon-jsx";
import theme from "./theme";
import Container from "./Container";

addDecorator(withKnobs);
addDecorator(jsxDecorator);
addDecorator((storyFn) => <Container>{storyFn()}</Container>);

addParameters({
	options: {
		theme: theme,
	},
});
