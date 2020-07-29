// Copyright 2017-2019 @polkadot/apps authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ApiProps } from '@polkadot/react-api/types';
import { I18nProps } from '@polkadot/react-components/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { Route } from '@polkadot/apps-routing/types';
import { AccountId } from '@polkadot/types/interfaces';

import React, { useContext, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ApiPromise } from '@polkadot/api';
import { Icon, Menu, Tooltip } from '@polkadot/react-components';
import accountObservable from '@polkadot/ui-keyring/observable/accounts';
import { ApiContext, withCalls, withMulti, withObservable } from '@polkadot/react-api';
import { isFunction } from '@polkadot/util';
import { Option } from '@polkadot/types';

import translate from '../translate';

import { queryToProp } from '@polkadot/joy-utils/index';
import { ElectionStage } from '@joystream/types/council';
import { councilSidebarName } from '@polkadot/apps-routing/joy-election';

interface Props extends I18nProps {
  isCollapsed: boolean;
  onClick: () => void;
  allAccounts?: SubjectInfo;
  route: Route;
  electionStage: Option<ElectionStage>;
  sudoKey?: AccountId;
}

type Subtitle = {
  text: string;
  classes: string[];
};

const disabledLog: Map<string, string> = new Map();
const TOOLTIP_OFFSET = { right: -4 };

function logDisabled (route: string, message: string): void {
  if (!disabledLog.get(route)) {
    disabledLog.set(route, message);

    console.warn(`Disabling ${route}: ${message}`);
  }
}

function hasEndpoint (api: ApiPromise, endpoint: string): boolean {
  const [area, section, method] = endpoint.split('.');

  try {
    return isFunction((api as any)[area][section][method]);
  } catch (error) {
    return false;
  }
}

function checkVisible (
  name: string,
  { api, isApiReady, isApiConnected }: ApiProps,
  hasAccounts: boolean,
  hasSudo: boolean,
  { isHidden, needsAccounts, needsApi, needsSudo }: Route['display']
): boolean {
  if (isHidden) {
    return false;
  } else if (needsAccounts && !hasAccounts) {
    return false;
  } else if (!needsApi) {
    return true;
  } else if (!isApiReady || !isApiConnected) {
    return false;
  } else if (needsSudo && !hasSudo) {
    logDisabled(name, 'Sudo key not available');
    return false;
  }

  const notFound = needsApi.filter((endpoint: string | string[]): boolean => {
    const hasApi = Array.isArray(endpoint)
      ? endpoint.reduce((hasApi, endpoint): boolean => hasApi || hasEndpoint(api, endpoint), false)
      : hasEndpoint(api, endpoint);

    return !hasApi;
  });

  if (notFound.length !== 0) {
    logDisabled(name, `API not available: ${notFound}`);
  }

  return notFound.length === 0;
}

function Item ({
  allAccounts,
  route: { Modal, display, i18n, icon, name },
  t,
  isCollapsed,
  onClick,
  sudoKey,
  electionStage
}: Props): React.ReactElement<Props> | null {
  const apiProps = useContext(ApiContext);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [hasSudo, setHasSudo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect((): void => {
    setHasAccounts(Object.keys(allAccounts || {}).length !== 0);
  }, [allAccounts]);

  useEffect((): void => {
    setHasSudo(!!sudoKey && Object.keys(allAccounts || {}).some((address): boolean => sudoKey.eq(address)));
  }, [allAccounts, sudoKey]);

  useEffect((): void => {
    setIsVisible(checkVisible(name, apiProps, hasAccounts, hasSudo, display));
  }, [apiProps, hasAccounts, hasSudo]);

  if (!isVisible) {
    return null;
  }

  const _getSubtitle = (name: string): Subtitle | undefined => {
    if (name === councilSidebarName) {
      if (electionStage && electionStage.isSome) {
        const classes: string[] = [];
        let text = 'No active election';
        if (electionStage.isSome) {
          const stageValue = electionStage.value as ElectionStage;
          const stageName = stageValue.type;
          text = `${stageName} stage`;
          classes.push(stageName);
        }
        return { text, classes };
      }
    }
    return undefined;
  };

  const subtitle = _getSubtitle(name);

  const body = (
    <>
      <Icon name={icon} />
      <span className="text SidebarItem">
        <div>{t(`sidebar.${name}`, i18n)}</div>
        {subtitle && <div className={`SidebarSubtitle ${subtitle.classes.join(' ')}`}>{subtitle.text}</div>}
      </span>
      <Tooltip offset={TOOLTIP_OFFSET} place="right" text={t(`sidebar.${name}`, i18n)} trigger={`nav-${name}`} />
    </>
  );

  return (
    <Menu.Item className="apps--SideBar-Item">
      {Modal ? (
        <a
          className="apps--SideBar-Item-NavLink"
          data-for={`nav-${name}`}
          data-tip
          data-tip-disable={!isCollapsed}
          onClick={onClick}
        >
          {body}
        </a>
      ) : (
        <NavLink
          activeClassName="apps--SideBar-Item-NavLink-active"
          className="apps--SideBar-Item-NavLink"
          data-for={`nav-${name}`}
          data-tip
          data-tip-disable={!isCollapsed}
          onClick={onClick}
          to={`/${name}`}
        >
          {body}
        </NavLink>
      )}
    </Menu.Item>
  );
}

export default withMulti(
  Item,
  translate,
  withCalls(queryToProp('query.councilElection.stage', { propName: 'electionStage' })),
  withCalls<Props>(['query.sudo.key', { propName: 'sudoKey' }]),
  withObservable(accountObservable.subject, { propName: 'allAccounts' })
);
