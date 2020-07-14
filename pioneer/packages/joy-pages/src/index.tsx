import React from 'react';
import Page from './Page';

import ToS_md from './md/ToS.md';

import Privacy_md from './md/Privacy.md';
export function ToS () {
  return <Page md={ToS_md} />;
}
export function Privacy () {
  return <Page md={Privacy_md} />;
}
