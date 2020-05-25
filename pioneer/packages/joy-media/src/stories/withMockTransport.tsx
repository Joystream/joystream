import React from 'react';
import { MockTransportProvider } from '../TransportContext';

export const withMockTransport = (storyFn: () => React.ReactElement) =>
	<MockTransportProvider>{storyFn()}</MockTransportProvider>;
