// Copyright 2017-2019 @polkadot/ui-settings authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import EventEmitter from 'eventemitter3';
import store from 'store';
import { isUndefined } from '@polkadot/util';

import { CRYPTOS, ENDPOINT_DEFAULT, ENDPOINTS, ICON_DEFAULT, ICONS, LANGUAGE_DEFAULT, LANGUAGES, LEDGER_CONN, LEDGER_CONN_DEFAULT, LOCKING_DEFAULT, LOCKING, PREFIX_DEFAULT, PREFIXES, UIMODE_DEFAULT, UIMODES, UITHEME_DEFAULT, UITHEMES, CAMERA, CAMERA_DEFAULT } from './defaults';
import { Option, SettingsStruct } from './types';

type ChangeCallback = (settings: SettingsStruct) => void;
type OnTypes = 'change';

export class Settings implements SettingsStruct {
  private _apiUrl: string;

  private _emitter: EventEmitter;

  private _i18nLang: string;

  private _icon: string;

  private _ledgerConn: string;

  private _locking: string;

  private _prefix: number;

  private _uiMode: string;

  private _uiTheme: string;

  private _camera: string;

  public constructor () {
    const settings = store.get('settings') || {};

    this._emitter = new EventEmitter();

    // Transition from acropolis - since visitors are coming to the same domain they most likely
    // have the endpoint url saved in local storage. Replace it with new rome default endpoint.
    if (settings.apiUrl == 'wss://testnet.joystream.org/acropolis/rpc/') {
      this._apiUrl = process.env.WS_URL || ENDPOINT_DEFAULT || 'wss://rome-rpc-endpoint.joystream.org:9944/';
    } else {
      this._apiUrl = settings.apiUrl || process.env.WS_URL || ENDPOINT_DEFAULT;
    }

    this._ledgerConn = settings.ledgerConn || LEDGER_CONN_DEFAULT;
    this._i18nLang = settings.i18nLang || LANGUAGE_DEFAULT;
    this._icon = settings.icon || ICON_DEFAULT;
    this._locking = settings.locking || LOCKING_DEFAULT;
    this._prefix = isUndefined(settings.prefix) ? PREFIX_DEFAULT : settings.prefix;
    this._uiMode = settings.uiMode || UIMODE_DEFAULT;
    this._uiTheme = settings.uiTheme || UITHEME_DEFAULT;
    this._camera = settings.camera || CAMERA_DEFAULT;
  }

  public get apiUrl (): string {
    return this._apiUrl;
  }

  public get i18nLang (): string {
    return this._i18nLang;
  }

  public get icon (): string {
    return this._icon;
  }

  public get ledgerConn (): string {
    return this._ledgerConn;
  }

  public get locking (): string {
    return this._locking;
  }

  public get prefix (): number {
    return this._prefix;
  }

  public get uiMode (): string {
    return this._uiMode;
  }

  get isBasicMode (): boolean {
    return this._uiMode === 'light';
  }

  get isFullMode (): boolean {
    return this._uiMode === 'full';
  }

  public get uiTheme (): string {
    return this._uiTheme;
  }

  public get availableCryptos (): Option[] {
    return CRYPTOS;
  }

  public get availableIcons (): Option[] {
    return ICONS;
  }

  public get availableLanguages (): Option[] {
    return LANGUAGES;
  }

  public get availableLedgerConn (): Option[] {
    return LEDGER_CONN;
  }

  public get availableLocking (): Option[] {
    return LOCKING;
  }

  public get availableNodes (): Option[] {
    return ENDPOINTS;
  }

  public get availablePrefixes (): Option[] {
    return PREFIXES;
  }

  public get availableUIModes (): Option[] {
    return UIMODES;
  }

  public get availableUIThemes (): Option[] {
    return UITHEMES;
  }

  public get camera (): string {
    return this._camera;
  }

  public get availableCamera (): Option[] {
    return CAMERA;
  }

  public get (): SettingsStruct {
    return {
      apiUrl: this._apiUrl,
      i18nLang: this._i18nLang,
      icon: this._icon,
      ledgerConn: this._ledgerConn,
      locking: this._locking,
      prefix: this._prefix,
      uiMode: this._uiMode,
      uiTheme: this._uiTheme,
      camera: this._camera
    };
  }

  public set (settings: Partial<SettingsStruct>): void {
    this._apiUrl = settings.apiUrl || this._apiUrl;
    this._ledgerConn = settings.ledgerConn || this._ledgerConn;
    this._i18nLang = settings.i18nLang || this._i18nLang;
    this._icon = settings.icon || this._icon;
    this._locking = settings.locking || this._locking;
    this._prefix = isUndefined(settings.prefix) ? this._prefix : settings.prefix;
    this._uiMode = settings.uiMode || this._uiMode;
    this._uiTheme = settings.uiTheme || this._uiTheme;

    const newValues = this.get();

    store.set('settings', newValues);
    this._emitter.emit('change', newValues);
  }

  public on (type: OnTypes, cb: ChangeCallback): void {
    this._emitter.on(type, cb);
  }
}

const settings = new Settings();

export default settings;
