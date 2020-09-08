import React from 'react';
import { Icon, SemanticICONS } from 'semantic-ui-react';

import { OpeningState } from './classifiers';

export type headerMarkup = {
  class: string;
  description: string;
  icon: SemanticICONS;
  iconSpin?: boolean;
}

export const stateMarkup = new Map<OpeningState, headerMarkup>([
  [OpeningState.WaitingToBegin, {
    class: 'waiting-to-begin',
    description: 'Waiting to begin',
    icon: 'spinner',
    iconSpin: true
  }],
  [OpeningState.AcceptingApplications, {
    class: 'active',
    description: 'Accepting applications',
    icon: 'heart'
  }],
  [OpeningState.InReview, {
    class: 'in-review',
    description: 'Applications in review',
    icon: 'hourglass half'
  }],
  [OpeningState.Complete, {
    class: 'complete',
    description: 'Hiring complete',
    icon: 'thumbs up'
  }],
  [OpeningState.Cancelled, {
    class: 'cancelled',
    description: 'Cancelled',
    icon: 'ban'
  }]
]);

export function openingStateMarkup<T> (state: OpeningState, key: string): T {
  const markup = stateMarkup.get(state);

  if (typeof markup === 'undefined') {
    return null as unknown as T;
  }

  return (markup as any)[key];
}

export function openingClass (state: OpeningState): string {
  return 'status-' + openingStateMarkup<string>(state, 'class');
}

export function openingDescription (state: OpeningState): string {
  return openingStateMarkup<string>(state, 'description');
}

export function openingIcon (state: OpeningState) {
  const icon = openingStateMarkup<SemanticICONS>(state, 'icon');
  const spin = openingStateMarkup<boolean>(state, 'iconSpin');

  return <Icon name={icon} loading={spin} />;
}
