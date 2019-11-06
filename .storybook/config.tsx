import React from 'react'
import { configure, addDecorator } from '@storybook/react';
import '@storybook/addon-console';
import StoryRouter from 'storybook-react-router';

import 'semantic-ui-css/semantic.min.css'
import './style.css'

addDecorator(StoryRouter());

addDecorator(story => (
  <div className='StorybookRoot'>{story()}</div>
));

configure(require.context('../packages', true, /\.stories\.tsx?$/), module)
