import { DateTime } from 'luxon'

export const formatDateShort = (date: DateTime): string => {
  return date.setLocale('en-gb').toLocaleString(DateTime.DATE_MED)
}
