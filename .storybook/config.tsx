import React from 'react'
import { configure, addDecorator } from '@storybook/react';
import '@storybook/addon-console';
import StoryRouter from 'storybook-react-router';
 
addDecorator(StoryRouter());

addDecorator(story => (
  <div style={{padding: '0.5em 2em'}}>{story()}</div>
));

configure(require.context('../packages', true, /\.stories\.tsx?$/), module)
