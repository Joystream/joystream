// Copyright 2017-2019 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routes } from './types';

import Tokenomics from '@polkadot/joy-tokenomics';

export default ([
  {
    Component: Tokenomics,
    display: {
      needsAccounts: true,
      needsApi: [
        'query.balances.totalIssuance',
        'query.recurringRewards.rewardRelationships',
        'query.contentWorkingGroup.curatorById',
        'query.contentWorkingGroup.currentLeadId',
        'query.council.activeCouncil',
        'query.council.payoutInterval',
        'query.council.amountPerPayout',
        'query.councilElection.newTermDuration',
        'query.councilElection.votingPeriod',
        'query.councilElection.revealingPeriod',
        'query.councilElection.announcingPeriod',
        'query.storageWorkingGroup.currentLead',
        'query.storageWorkingGroup.workerById',
        'query.stake.stakes',
        'query.staking.currentElected'
      ]
    },
    i18n: {
      defaultValue: 'Overview'
    },
    icon: 'th',
    name: 'tokenomics'
  }
] as Routes);
