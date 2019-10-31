import { configure, addDecorator } from '@storybook/react';
import '@storybook/addon-console';
import StoryRouter from 'storybook-react-router';
 
addDecorator(StoryRouter());

configure(require.context('../packages', true, /\.stories\.tsx?$/), module)
