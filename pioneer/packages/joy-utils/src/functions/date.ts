import moment from 'moment';

export function formatDate (date: moment.Moment): string {
  return date.format('DD/MM/YYYY LT');
}
