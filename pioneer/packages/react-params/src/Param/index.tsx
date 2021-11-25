// Copyright 2017-2020 @polkadot/react-params authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Props, Props as CProps } from '../types';

import React, { useRef } from 'react';
import { classes } from '@polkadot/react-components/util';
import { encodeTypeDef } from '@polkadot/types/create';
import { isUndefined } from '@polkadot/util';

import findComponent from './findComponent';
import Static from './Static';
import { registry } from '@joystream/types';

function Param ({ className = '', defaultValue, isDisabled, isInOption, isOptional, name, onChange, onEnter, onEscape, overrides, type }: Props): React.ReactElement<Props> | null {
  const compRef = useRef<React.ComponentType<CProps> | null>(findComponent(type, overrides));

  if (!compRef.current) {
    return null;
  }

  const label = isUndefined(name)
    ? encodeTypeDef(registry, type)
    : `${name}: ${encodeTypeDef(registry, type)}`;

  return isOptional
    ? (
      <Static
        defaultValue={defaultValue}
        label={label}
        type={type}
      />
    )
    : (
      <compRef.current
        className={classes('ui--Param', className)}
        defaultValue={defaultValue}
        isDisabled={isDisabled}
        isInOption={isInOption}
        key={`${name || 'unknown'}:${type.toString()}`}
        label={label}
        name={name}
        onChange={onChange}
        onEnter={onEnter}
        onEscape={onEscape}
        overrides={overrides}
        type={type}
      />
    );
}

export default React.memo(Param);
