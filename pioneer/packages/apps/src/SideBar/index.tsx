// Copyright 2017-2019 @polkadot/apps authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { I18nProps } from '@polkadot/react-components/types';
import { SIDEBAR_MENU_THRESHOLD } from '../constants';

import './SideBar.css';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Responsive, Icon, SemanticICONS } from 'semantic-ui-react';
import routing from '@polkadot/apps-routing';
import { Button, ChainImg, Menu, media } from '@polkadot/react-components';
import { classes } from '@polkadot/react-components/util';

import translate from '../translate';
import Item from './Item';
import NetworkModal from '../modals/Network';

interface Props extends I18nProps /* ApiProps, */ {
  className?: string;
  collapse: () => void;
  handleResize: () => void;
  isCollapsed: boolean;
  menuOpen: boolean;
  toggleMenu: () => void;
}

type OuterLinkProps = {
  url: string;
  title: string;
  icon?: SemanticICONS;
};

export function OuterLink ({ url, title, icon = 'external alternate' }: OuterLinkProps) {
  return (
    <Menu.Item className="apps--SideBar-Item">
      <a className="apps--SideBar-Item-NavLink" href={url} target="_blank" rel="noopener noreferrer">
        <Icon name={icon} />
        <span className="text">{title}</span>
      </a>
    </Menu.Item>
  );
}

function JoystreamLogo (isCollapsed: boolean) {
  const logo = isCollapsed ? 'images/logo-j.svg' : 'images/logo-joytream.svg';
  return <img alt="Joystream" className="apps--SideBar-logo" src={logo} />;
}

function SideBar ({
  className,
  collapse,
  handleResize,
  isCollapsed,
  toggleMenu,
  menuOpen
}: Props): React.ReactElement<Props> {
  const [modals, setModals] = useState<Record<string, boolean>>(
    routing.routes.reduce(
      (result: Record<string, boolean>, route): Record<string, boolean> => {
        if (route && route.Modal) {
          result[route.name] = false;
        }

        return result;
      },
      { network: false }
    )
  );

  const _toggleModal = (name: string): (() => void) => (): void => setModals({ ...modals, [name]: !modals[name] });

  return (
    <Responsive
      onUpdate={handleResize}
      className={classes(className, 'apps-SideBar-Wrapper', isCollapsed ? 'collapsed' : 'expanded')}
    >
      <ChainImg className={`toggleImg ${menuOpen ? 'closed' : 'open delayed'}`} onClick={toggleMenu} />
      {routing.routes.map(
        (route): React.ReactNode =>
          route && route.Modal ? (
            route.Modal && modals[route.name] ? (
              <route.Modal key={route.name} onClose={_toggleModal(route.name)} />
            ) : (
              <div key={route.name} />
            )
          ) : null
      )}
      {modals.network && <NetworkModal onClose={_toggleModal('network')} />}
      <div className="apps--SideBar">
        <Menu secondary vertical>
          <div className="apps-SideBar-Scroll">
            {JoystreamLogo(isCollapsed)}
            {routing.routes.map(
              (route, index): React.ReactNode =>
                route ? (
                  <Item
                    isCollapsed={isCollapsed}
                    key={route.name}
                    route={route}
                    onClick={route.Modal ? _toggleModal(route.name) : handleResize}
                  />
                ) : (
                  <Menu.Divider hidden key={index} />
                )
            )}
            {/* <Menu.Divider hidden />
            <OuterLink url='https://joystream.org/testnet' title='Tokenomics' />
            <OuterLink url='https://blog.joystream.org/constantinople-incentives/' title='Earn Monero' />
            <Menu.Divider hidden /> */}
          </div>
          <Responsive
            minWidth={SIDEBAR_MENU_THRESHOLD}
            className={`apps--SideBar-collapse ${isCollapsed ? 'collapsed' : 'expanded'}`}
          >
            <Button icon={`angle double ${isCollapsed ? 'right' : 'left'}`} isBasic isCircular onClick={collapse} />
          </Responsive>
        </Menu>
        <Responsive minWidth={SIDEBAR_MENU_THRESHOLD}>
          <div className="apps--SideBar-toggle" onClick={collapse} />
        </Responsive>
      </div>
    </Responsive>
  );
}

export default translate(
  styled(SideBar)`
    .toggleImg {
      cursor: pointer;
      height: 2.75rem;
      left: 0.9rem;
      opacity: 0;
      position: absolute;
      top: 0px;
      transition: opacity 0.2s ease-in, top 0.2s ease-in;
      width: 2.75rem;

      &.delayed {
        transition-delay: 0.4s;
      }

      &.open {
        opacity: 1;
        top: 0.9rem;
      }

      ${media.DESKTOP`
        opacity: 0 !important;
        top: -2.9rem !important;
      `}
    }
  `
);
