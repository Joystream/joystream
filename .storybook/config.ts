import { configure } from '@storybook/react';
import '@storybook/addon-console';

configure(require.context('../packages', true, /\.stories\.tsx?$/), module)
