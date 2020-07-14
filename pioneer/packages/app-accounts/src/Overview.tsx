// Copyright 2017-2019 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { I18nProps } from '@polkadot/react-components/types';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { ComponentProps } from './types';

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button as SUIButton } from 'semantic-ui-react';
import keyring from '@polkadot/ui-keyring';
import accountObservable from '@polkadot/ui-keyring/observable/accounts';
import { getLedger, isLedger, withMulti, withObservable } from '@polkadot/react-api';
import { Button, CardGrid } from '@polkadot/react-components';

import CreateModal from './modals/Create';
import ImportModal from './modals/Import';
import Account from './Account';
import translate from './translate';

interface Props extends ComponentProps, I18nProps {
  accounts?: SubjectInfo[];
}

// query the ledger for the address, adding it to the keyring
async function queryLedger (): Promise<void> {
  const ledger = getLedger();

  try {
    const { address } = await ledger.getAddress();

    keyring.addHardware(address, 'ledger', { name: 'ledger' });
  } catch (error) {
    console.error(error);
  }
}

function Overview ({ accounts, onStatusChange, t }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const emptyScreen = !(isCreateOpen || isImportOpen) && accounts && (Object.keys(accounts).length === 0);

  const _toggleCreate = (): void => setIsCreateOpen(!isCreateOpen);
  const _toggleImport = (): void => setIsImportOpen(!isImportOpen);

  return (
    <CardGrid
      topButtons={
        !emptyScreen && <SUIButton as={Link} to={`${pathname}/vanity`}>Generate a vanity address</SUIButton>
      }
      buttons={
        <Button.Group>
          <Button
            icon='add'
            isPrimary
            label={t('Add account')}
            onClick={_toggleCreate}
          />
          <Button.Or />
          <Button
            icon='sync'
            isPrimary
            label={t('Restore JSON')}
            onClick={_toggleImport}
          />
          {isLedger() && (
            <>
              <Button.Or />
              <Button
                icon='question'
                isPrimary
                label={t('Query Ledger')}
                onClick={queryLedger}
              />
            </>
          )}
        </Button.Group>
      }
      isEmpty={emptyScreen}
      emptyText={t('No account yet?')}
    >
      {isCreateOpen && (
        <CreateModal
          onClose={_toggleCreate}
          onStatusChange={onStatusChange}
        />
      )}
      {isImportOpen && (
        <ImportModal
          onClose={_toggleImport}
          onStatusChange={onStatusChange}
        />
      )}
      {accounts && Object.keys(accounts).map((address): React.ReactNode => (
        <Account
          address={address}
          key={address}
        />
      ))}
    </CardGrid>
  );
}

export default withMulti(
  Overview,
  translate,
  withObservable(accountObservable.subject, { propName: 'accounts' })
);
