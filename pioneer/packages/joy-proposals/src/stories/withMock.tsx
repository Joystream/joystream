import React from 'react';
import { createMemoryHistory, createLocation } from 'history';
import { match, RouteComponentProps } from 'react-router';

const history = createMemoryHistory();
const path = '/';
const matchObj: match<{}> = {
  isExact: false,
  path,
  url: path,
  params: {}
};
const location = createLocation(path);

const MockRouteProps: RouteComponentProps = {
  history,
  match: matchObj,
  location
};

export default function withMock (Component: React.ComponentType<any>) {
  // TODO: Use mock transport
  return <Component {...MockRouteProps} />;
}
