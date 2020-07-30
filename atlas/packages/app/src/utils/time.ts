import { DateTime, Duration } from 'luxon'

export const formatDateShort = (date: DateTime): string => {
  return date.setLocale('en-gb').toLocaleString(DateTime.DATE_MED)
}

export const formatDurationShort = (duration: Duration): string => {
  const format = duration.as('hours') >= 1 ? 'h:mm:ss' : 'mm:ss'
  return duration.toFormat(format)
}
