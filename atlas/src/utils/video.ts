import { formatNumber, formatNumberShort } from '@/utils/number'
import { formatDateAgo } from '@/utils/time'

export const formatVideoViewsAndDate = (
  views: number | null,
  date: Date,
  { fullViews } = { fullViews: false }
): string => {
  const formattedDate = formatDateAgo(date)
  const formattedViews = views !== null && (fullViews ? formatNumber(views) : formatNumberShort(views))
  return formattedViews ? `${formattedViews} views • ${formattedDate}` : formattedDate
}
