import { ApiParamsOptions, ApiMethodNamedArgs, ApiParamOptions, ApiMethodArg } from '../Types'
import { Validator } from 'inquirer'

export function setDefaults(promptOptions: ApiParamsOptions, defaultValues: ApiMethodNamedArgs) {
  for (const defaultValue of defaultValues) {
    const { name: paramName, value: paramValue } = defaultValue
    const paramOptions = promptOptions[paramName]
    if (paramOptions && paramOptions.value) {
      paramOptions.value.default = paramValue
    } else if (paramOptions) {
      promptOptions[paramName].value = { default: paramValue }
    } else {
      promptOptions[paramName] = { value: { default: paramValue } }
    }
  }
}

// Temporary(?) helper for easier creation of common ApiParamOptions
export function createParamOptions(
  forcedName?: string,
  defaultValue?: ApiMethodArg | undefined,
  validator?: Validator
): ApiParamOptions {
  const paramOptions: ApiParamOptions = { forcedName, validator }
  if (defaultValue) {
    paramOptions.value = { default: defaultValue }
  }

  return paramOptions
}
