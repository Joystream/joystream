import moment from 'moment';

export function printExplicit(explicit?: boolean): string {
  return explicit === true ? 'Yes' : 'No'
}

export function printReleaseDate(linuxTimestamp?: number): string {
  return !linuxTimestamp ? '' : moment(linuxTimestamp * 1000).format('YYYY-MM-DD')
}
