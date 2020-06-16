import moment from 'moment';

export function formatDate (date: moment.Moment): string {
  return date.format('YYYY/MM/DD LT');
}
