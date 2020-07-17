//
// Validators for console input
// (usable with inquirer package)
//

type Validator = (value: any) => boolean | string

export const isInt = (message?: string) => (value: any) =>
  (typeof value === 'number' && Math.floor(value) === value) ||
  (typeof value === 'string' && parseInt(value).toString() === value)
    ? true
    : message || 'The value must be an integer!'

export const gte = (min: number, message?: string) => (value: any) =>
  parseFloat(value) >= min
    ? true
    : message?.replace('{min}', min.toString()) || `The value must be a number greater than or equal ${min}`

export const lte = (max: number, message?: string) => (value: any) =>
  parseFloat(value) <= max
    ? true
    : message?.replace('{max}', max.toString()) || `The value must be less than or equal ${max}`

export const minLen = (min: number, message?: string) => (value: any) =>
  typeof value === 'string' && value.length >= min
    ? true
    : message?.replace('{min}', min.toString()) || `The value should be at least ${min} character(s) long`

export const maxLen = (max: number, message?: string) => (value: any) =>
  typeof value === 'string' && value.length <= max
    ? true
    : message?.replace('{max}', max.toString()) || `The value cannot be more than ${max} character(s) long`

export const combined = (validators: Validator[], message?: string) => (value: any) => {
  for (const validator of validators) {
    const result = validator(value)
    if (result !== true) {
      return message || result
    }
  }

  return true
}

export const positiveInt = (message?: string) => combined([isInt(), gte(0)], message)

export const minMaxInt = (min: number, max: number, message?: string) =>
  combined([isInt(), gte(min), lte(max)], message?.replace('{min}', min.toString()).replace('{max}', max.toString()))

export const minMaxStr = (min: number, max: number, message?: string) =>
  combined([minLen(min), maxLen(max)], message?.replace('{min}', min.toString()).replace('{max}', max.toString()))
