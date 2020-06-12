// Copyright 2017-2019 @polkadot/app-accounts authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { I18nProps } from '@polkadot/react-components/types';
import { KeypairType } from '@polkadot/util-crypto/types';
import { ModalProps } from '../types';

import { useMyAccount } from '@polkadot/joy-utils/MyAccountContext';
import { generateSeed, updateAddress, createAccount, isPasswordValid, AddressState, SeedType } from '@polkadot/joy-utils/accounts';
import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { ApiContext } from '@polkadot/react-api';
import { AddressRow, Button, Dropdown, Input, Modal, Password } from '@polkadot/react-components';
import uiSettings from '@polkadot/ui-settings';

import translate from '../translate';
import CreateConfirmation from './CreateConfirmation';

interface Props extends ModalProps, I18nProps {
  seed?: string;
  type?: KeypairType;
}

function Create ({ className, onClose, onStatusChange, seed: propsSeed, t, type: propsType }: Props): React.ReactElement<Props> {
  const { isDevelopment } = useContext(ApiContext);
  const [{ address, deriveError, derivePath, isSeedValid, pairType, seed, seedType }, setAddress] = useState<AddressState>(generateSeed(propsSeed, '', propsSeed ? 'raw' : 'bip', propsType));
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [{ isNameValid, name }, setName] = useState({ isNameValid: false, name: '' });
  const [{ isPassValid, password }, setPassword] = useState({ isPassValid: false, password: '' });
  const isValid = !!address && !deriveError && isNameValid && isPassValid && isSeedValid;

  const _onChangePass = (password: string): void =>
    setPassword({ isPassValid: isPasswordValid(password), password });
  const _onChangeDerive = (newDerivePath: string): void =>
    setAddress(updateAddress(seed, newDerivePath, seedType, pairType));
  const _onChangeSeed = (newSeed: string): void =>
    setAddress(updateAddress(newSeed, derivePath, seedType, pairType));
  const _onChangePairType = (newPairType: KeypairType): void =>
    setAddress(updateAddress(seed, derivePath, seedType, newPairType));
  const _selectSeedType = (newSeedType: SeedType): void => {
    if (newSeedType !== seedType) {
      setAddress(generateSeed(null, derivePath, newSeedType, pairType));
    }
  };
  const _onChangeName = (name: string): void => setName({ isNameValid: !!name.trim(), name });
  const _toggleConfirmation = (): void => setIsConfirmationOpen(!isConfirmationOpen);
  const context = useMyAccount();

  const _onCommit = (): void => {
    if (!isValid) {
      return;
    }

    const status = createAccount(`${seed}${derivePath}`, pairType, name, password, t('created account'));
    context.set(status.account as string);

    _toggleConfirmation();
    onStatusChange(status);
    onClose();
  };

  return (
    <Modal
      className={className}
      dimmer='inverted'
      open
    >
      <Modal.Header>{t('Add an account via seed')}</Modal.Header>
      {address && isConfirmationOpen && (
        <CreateConfirmation
          address={address}
          name={name}
          onCommit={_onCommit}
          onClose={_toggleConfirmation}
        />
      )}
      <Modal.Content>
        <AddressRow
          defaultName={name}
          noDefaultNameOpacity
          value={isSeedValid ? address : ''}
        >
          <Input
            autoFocus
            className='full'
            help={t('Name given to this account. You can edit it. To use the account to validate or nominate, it is a good practice to append the function of the account in the name, e.g "name_you_want - stash".')}
            isError={!isNameValid}
            label={t('name')}
            onChange={_onChangeName}
            onEnter={_onCommit}
            placeholder={t('new account')}
            value={name}
          />
          <Input
            className='full'
            help={t('The private key for your account is derived from this seed. This seed must be kept secret as anyone in its possession has access to the funds of this account. If you validate, use the seed of the session account as the "--key" parameter of your node.')}
            isAction
            isError={!isSeedValid}
            isReadOnly={seedType === 'dev'}
            label={
              seedType === 'bip'
                ? t('mnemonic seed')
                : seedType === 'dev'
                  ? t('development seed')
                  : t('seed (hex or string)')
            }
            onChange={_onChangeSeed}
            onEnter={_onCommit}
            value={seed}
          >
            <Dropdown
              isButton
              defaultValue={seedType}
              onChange={_selectSeedType}
              options={
                (
                  isDevelopment
                    ? [{ value: 'dev', text: t('Development') }]
                    : []
                ).concat(
                  { value: 'bip', text: t('Mnemonic') },
                  { value: 'raw', text: t('Raw seed') }
                )
              }
            />
          </Input>
          <Password
            className='full'
            help={t('This password is used to encrypt your private key. It must be strong and unique! You will need it to sign transactions with this account. You can recover this account using this password together with the backup file (generated in the next step).')}
            isError={!isPassValid}
            label={t('password')}
            onChange={_onChangePass}
            onEnter={_onCommit}
            value={password}
          />
          <details
            className='accounts--Creator-advanced'
            open
          >
            <summary>{t('Advanced creation options')}</summary>
            <Dropdown
              defaultValue={pairType}
              help={t('Determines what cryptography will be used to create this account. Note that to validate on Polkadot, the session account must use "ed25519".')}
              label={t('keypair crypto type')}
              onChange={_onChangePairType}
              options={uiSettings.availableCryptos}
            />
            <Input
              className='full'
              help={t('You can set a custom derivation path for this account using the following syntax "/<soft-key>//<hard-key>///<password>". The "/<soft-key>" and "//<hard-key>" may be repeated and mixed`. The "///password" is optional and should only occur once.')}
              isError={!!deriveError}
              label={t('secret derivation path')}
              onChange={_onChangeDerive}
              onEnter={_onCommit}
              placeholder={t('//hard/soft///password')}
              value={derivePath}
            />
            {deriveError && (
              <article className='error'>{deriveError}</article>
            )}
          </details>
        </AddressRow>
      </Modal.Content>
      <Modal.Actions>
        <Button.Group>
          <Button
            icon='cancel'
            isNegative
            label={t('Cancel')}
            onClick={onClose}
          />
          <Button.Or />
          <Button
            icon='plus'
            isDisabled={!isValid}
            isPrimary
            label={t('Save')}
            onClick={_toggleConfirmation}
          />
        </Button.Group>
      </Modal.Actions>
    </Modal>
  );
}

export default translate(
  styled(Create)`
    .accounts--Creator-advanced {
      margin-top: 1rem;
    }
  `
);
