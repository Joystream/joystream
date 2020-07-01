import { ApiParamsOptions, ApiMethodNamedArgs, ApiParamOptions, ApiMethodArg } from '../Types'
import { Validator } from 'inquirer';

export function setDefaults(promptOptions: ApiParamsOptions, defaultValues: ApiMethodNamedArgs) {
    for (const [paramName, defaultValue] of Object.entries(defaultValues)) {
        const paramOptions = promptOptions[paramName];
        if (paramOptions && paramOptions.value) {
            paramOptions.value.default = defaultValue;
        }
        else if (paramOptions) {
            promptOptions[paramName].value = { default: defaultValue };
        }
        else {
            promptOptions[paramName] = { value: { default: defaultValue } };
        }
    }
}

// Temporary(?) helper for easier creation of common ApiParamOptions
export function createParamOptions(forcedName?: string, defaultValue?: ApiMethodArg | undefined, validator?: Validator): ApiParamOptions {
    const paramOptions: ApiParamOptions = { forcedName, validator };
    if (defaultValue) {
        paramOptions.value = { default: defaultValue };
    }

    return paramOptions;
}
