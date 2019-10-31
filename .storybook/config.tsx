import React from 'react'
import { configure, addDecorator } from '@storybook/react';
import '@storybook/addon-console';
import StoryRouter from 'storybook-react-router';
 
addDecorator(StoryRouter());

addDecorator(story => (
  <div style={{padding: '1em'}}>{story()}</div>
));

configure(require.context('../packages', true, /\.stories\.tsx?$/), module)
