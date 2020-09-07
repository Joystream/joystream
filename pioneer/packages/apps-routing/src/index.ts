// Copyright 2017-2020 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routes } from './types';

import appSettings from '@polkadot/ui-settings';

// When adding here, also ensure to add to Dummy.tsx

import accounts from './accounts';
import explorer from './explorer';
import extrinsics from './extrinsics';
import js from './js';
import settings from './settings';
import staking from './staking';
import storage from './storage';
import sudo from './sudo';
import toolbox from './toolbox';
import transfer from './transfer';
import memo from './memo';
// Joy packages
import members from './joy-members';
import { terms, privacyPolicy } from './joy-pages';
import election from './joy-election';
import proposals from './joy-proposals';
import roles from './joy-roles';
import media from './joy-media';
import forum from './joy-forum';

export default function create (t: <T = string> (key: string, text: string, options: { ns: string }) => T): Routes {
  return appSettings.uiMode === 'light'
    ? [
      media(t),
      members(t),
      roles(t),
      election(t),
      proposals(t),
      forum(t),
      staking(t),
      null,
      transfer(t),
      accounts(t),
      memo(t),
      settings(t),
      // Those are hidden
      terms(t),
      privacyPolicy(t)
    ]
    : [
      media(t),
      members(t),
      roles(t),
      election(t),
      proposals(t),
      forum(t),
      staking(t),
      null,
      transfer(t),
      accounts(t),
      memo(t),
      settings(t),
      null,
      explorer(t),
      storage(t),
      extrinsics(t),
      js(t),
      toolbox(t),
      sudo(t),
      null,
      // Those are hidden
      terms(t),
      privacyPolicy(t)
    ];
}
