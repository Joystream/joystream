export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US').split(',').join(' ')
}

export const formatNumberShort = (num: number): string => {
  let value = num
  let suffix = ''

  if (num > 1000000) {
    value /= 1000000
    suffix = 'M'
  } else if (num > 1000) {
    value /= 1000
    suffix = 'K'
  }

  return `${value % 1 === 0 ? value : value.toFixed(1)}${suffix}`
}
