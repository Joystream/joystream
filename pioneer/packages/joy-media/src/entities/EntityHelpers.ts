import moment from 'moment';
import ISO6391 from 'iso-639-1';
import { LanguageType } from '../schemas/general/Language';

export function printExplicit (explicit?: boolean): string {
  return explicit === true ? 'Yes' : 'No';
}

export function printReleaseDate (linuxTimestamp?: number): string {
  return !linuxTimestamp ? '' : moment(linuxTimestamp * 1000).format('YYYY-MM-DD');
}

export function printLanguage (language?: LanguageType): string {
  return !language ? '' : ISO6391.getName(language.value);
}
