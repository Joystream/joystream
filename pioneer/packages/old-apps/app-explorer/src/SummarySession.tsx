// Copyright 2017-2019 @polkadot/app-explorer authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { DerivedSessionInfo } from '@polkadot/api-derive/types';
import { I18nProps } from '@polkadot/react-components/types';

import React from 'react';
import { CardSummary } from '@polkadot/react-components';
import { withCalls } from '@polkadot/react-api';

import translate from './translate';
import { formatNumber } from '@polkadot/util';

import { SessionIndex } from '@polkadot/types/interfaces';
import { u64 } from '@polkadot/types/primitive';

interface Props extends I18nProps {
  sessionInfo?: DerivedSessionInfo;
  withEra?: boolean;
  withSession?: boolean;
  epochIndex?: u64;
  currentEraStartSessionIndex?: SessionIndex;
}

function renderSession ({ sessionInfo, t, withSession = true }: Props): React.ReactNode {
  if (!withSession || !sessionInfo) {
    return null;
  }

  const label = sessionInfo.isEpoch && sessionInfo.sessionLength.gtn(1)
    ? t('epoch')
    : t('session');

  return sessionInfo.sessionLength.gtn(0)
    ? (
      <CardSummary
        label={label}
        progress={{
          total: sessionInfo.sessionLength,
          value: sessionInfo.sessionProgress
        }}
      />
    )
    : (
      <CardSummary label={label}>
        {formatNumber(sessionInfo.currentIndex)}
      </CardSummary>
    );
}

function renderEra ({ sessionInfo, t, withEra = true, epochIndex, currentEraStartSessionIndex }: Props): React.ReactNode {
  if (!withEra || !sessionInfo || !epochIndex || !currentEraStartSessionIndex) {
    return null;
  }

  const label = t('era');
  const { sessionLength, sessionProgress } = sessionInfo;
  // eraProgress is calculated the wrong way in polkadot/api v0.96.1 (fixed in v0.97.1)
  const eraProgress = epochIndex.sub(currentEraStartSessionIndex).mul(sessionLength).add(sessionProgress);

  return sessionInfo.sessionLength.gtn(0)
    ? (
      <CardSummary
        label={label}
        progress={{
          total: sessionInfo.eraLength,
          value: eraProgress
        }}
      />
    )
    : (
      <CardSummary label={label}>
        {formatNumber(sessionInfo.currentEra)}
      </CardSummary>
    );
}

function SummarySession (props: Props): React.ReactElement<Props> {
  return (
    <>
      {renderSession(props)}
      {renderEra(props)}
    </>
  );
}

export default translate(
  withCalls<Props>(
    ['derive.session.info', { propName: 'sessionInfo' }],
    ['query.babe.epochIndex', { propName: 'epochIndex' }],
    ['query.staking.currentEraStartSessionIndex', { propName: 'currentEraStartSessionIndex' }]
  )(SummarySession)
);
