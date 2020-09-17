import { format, formatDistanceToNowStrict } from 'date-fns'

export const formatDate = (date: Date) => format(date, 'd MMM yyyy')

export const formatDateAgo = (date: Date): string => {
  return `${formatDistanceToNowStrict(date)} ago`
}

export const formatDurationShort = (duration: number): string => {
  const MINUTES_IN_HOUR = 60
  const SECONDS_IN_HOUR = MINUTES_IN_HOUR * 60

  const normalize = (n: number) => n.toString().padStart(2, '0')

  let remaining = duration

  const hours = Math.floor(remaining / SECONDS_IN_HOUR)
  remaining = remaining % SECONDS_IN_HOUR

  const minutes = Math.floor(remaining / MINUTES_IN_HOUR)
  remaining = remaining % MINUTES_IN_HOUR

  const seconds = remaining

  if (hours) {
    return `${hours}:${normalize(minutes)}:${normalize(seconds)}`
  }

  return `${minutes}:${normalize(seconds)}`
}
