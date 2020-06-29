import React from 'react';
import { useLocation, Redirect } from 'react-router-dom';

export const LegacyPagingRedirect: React.FC = () => {
  const { pathname } = useLocation();
  const parsingRegexp = /(.+)\/page\/(\d+)/;
  const groups = parsingRegexp.exec(pathname);
  if (!groups) {
    return <em>Failed to parse the URL</em>;
  }

  const basePath = groups[1];
  const page = groups[2];
  const search = new URLSearchParams();
  search.set('page', page);
  return <Redirect to={{ pathname: basePath, search: search.toString() }} />;
};
