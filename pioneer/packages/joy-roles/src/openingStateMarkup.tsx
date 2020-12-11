import React from 'react';
import { Icon, SemanticICONS } from 'semantic-ui-react';

import { OpeningState } from './classifiers';

export type headerMarkup = {
  class: string;
  description: string;
  icon: SemanticICONS;
  iconSpin?: boolean;
}

export const stateMarkup: Record<OpeningState, headerMarkup> = {
  [OpeningState.WaitingToBegin]: {
    class: 'waiting-to-begin',
    description: 'Waiting to begin',
    icon: 'spinner',
    iconSpin: true
  },
  [OpeningState.AcceptingApplications]: {
    class: 'active',
    description: 'Accepting applications',
    icon: 'heart'
  },
  [OpeningState.InReview]: {
    class: 'in-review',
    description: 'Applications in review',
    icon: 'hourglass half'
  },
  [OpeningState.Complete]: {
    class: 'complete',
    description: 'Hiring complete',
    icon: 'thumbs up'
  },
  [OpeningState.Cancelled]: {
    class: 'cancelled',
    description: 'Cancelled',
    icon: 'ban'
  }
};

export function openingStateMarkup<K extends keyof headerMarkup> (state: OpeningState, key: K): headerMarkup[K] {
  const markup = stateMarkup[state];

  return markup[key];
}

export function openingClass (state: OpeningState): string {
  return `status-${openingStateMarkup(state, 'class') || ''}`;
}

export function openingDescription (state: OpeningState): string {
  return openingStateMarkup(state, 'description') || '';
}

export function openingIcon (state: OpeningState) {
  const icon = openingStateMarkup(state, 'icon');
  const spin = openingStateMarkup(state, 'iconSpin');

  return <Icon name={icon} loading={spin} />;
}
