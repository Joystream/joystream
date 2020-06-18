// Copyright 2017-2019 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routing, Routes } from './types';

import appSettings from '@polkadot/joy-settings/';

import election from './joy-election';
import forum from './joy-forum';
// import help from './joy-help';
import media from './joy-media';
import members from './joy-members';
import proposals from './joy-proposals';
import roles from './joy-roles';
import pages from './joy-pages';

// import template from './123code';
import accounts from './accounts';
import addressbook from './addressbook';
// import claims from './claims';
// import contracts from './contracts';
// import council from './council';
// import dashboard from './dashboard';
// import democracy from './democracy';
import explorer from './explorer';
import extrinsics from './extrinsics';
// import genericAsset from './generic-asset';
import js from './js';
// import parachains from './parachains';
import settings from './settings';
import staking from './staking';
import storage from './storage';
import sudo from './sudo';
import toolbox from './toolbox';
import transfer from './transfer';
// import treasury from './treasury';

let routes: Routes = ([] as Routes);

// Basic routes
routes = routes.concat(
  media,
  roles,
  proposals,
  election,
  forum,
  members,
  staking,
  null,
  transfer,
  accounts,
  addressbook,
  settings,
  pages
);

if (appSettings.isFullMode) {
  routes = routes.concat(
    null,
    explorer,
    storage,
    extrinsics,
    sudo,
    js,
    toolbox
  );
}

const setup: Routing = {
  default: 'media',
  routes
};

export default setup;
