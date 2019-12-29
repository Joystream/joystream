import React from 'react';
import { MockTransportProvider } from '../MediaView';

export const withMockTransport = (storyFn: () => React.ReactElement) =>
	<MockTransportProvider>{storyFn()}</MockTransportProvider>;
