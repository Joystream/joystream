import React from 'react';
import { createMemoryHistory, createLocation } from 'history';
import { match, RouteComponentProps } from 'react-router';
import style from '../style';
import styled from 'styled-components';

const StyledContainer = styled.div`${style}`;

const history = createMemoryHistory();
const path = '/';
const matchObj: match<Record<string, string | undefined>> = {
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
  return (
    <StyledContainer>
      <Component {...MockRouteProps} />
    </StyledContainer>
  );
}
