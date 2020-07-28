import ExitCodes from '../ExitCodes'
import { CLIError } from '@oclif/errors'
import StateAwareCommandBase from './StateAwareCommandBase'
import Api from '../Api'
import { getTypeDef, createType, Option, Tuple, Bytes } from '@polkadot/types'
import { Codec, TypeDef, TypeDefInfo, Constructor } from '@polkadot/types/types'
import { Vec, Struct, Enum } from '@polkadot/types/codec'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import chalk from 'chalk'
import { SubmittableResultImpl } from '@polkadot/api/types'
import ajv from 'ajv'
import { ApiMethodArg, ApiMethodNamedArgs, ApiParamsOptions, ApiParamOptions } from '../Types'
import { createParamOptions } from '../helpers/promptOptions'

class ExtrinsicFailedError extends Error {}

/**
 * Abstract base class for commands that require access to the API.
 */
export default abstract class ApiCommandBase extends StateAwareCommandBase {
  private api: Api | null = null
  forceSkipApiUriPrompt = false

  getApi(): Api {
    if (!this.api) throw new CLIError('Tried to get API before initialization.', { exit: ExitCodes.ApiError })
    return this.api
  }

  // Get original api for lower-level api calls
  getOriginalApi(): ApiPromise {
    return this.getApi().getOriginalApi()
  }

  async init() {
    await super.init()
    let apiUri: string = this.getPreservedState().apiUri
    if (!apiUri) {
      this.warn("You haven't provided a node/endpoint for the CLI to connect to yet!")
      apiUri = await this.promptForApiUri()
    }
    this.api = await Api.create(apiUri)
  }

  async promptForApiUri(): Promise<string> {
    let selectedNodeUri = await this.simplePrompt({
      type: 'list',
      message: 'Choose a node/endpoint:',
      choices: [
        {
          name: 'Local node (ws://localhost:9944)',
          value: 'ws://localhost:9944',
        },
        {
          name: 'Current Testnet official Joystream node (wss://rome-rpc-endpoint.joystream.org:9944/)',
          value: 'wss://rome-rpc-endpoint.joystream.org:9944/',
        },
        {
          name: 'Custom endpoint',
          value: '',
        },
      ],
    })

    if (!selectedNodeUri) {
      do {
        selectedNodeUri = await this.simplePrompt({
          type: 'input',
          message: 'Provide a WS endpoint uri',
        })
        if (!this.isApiUriValid(selectedNodeUri)) {
          this.warn('Provided uri seems incorrect! Please try again...')
        }
      } while (!this.isApiUriValid(selectedNodeUri))
    }

    await this.setPreservedState({ apiUri: selectedNodeUri })

    return selectedNodeUri
  }

  isApiUriValid(uri: string) {
    try {
      new WsProvider(uri)
    } catch (e) {
      return false
    }
    return true
  }

  // This is needed to correctly handle some structs, enums etc.
  // Where the main typeDef doesn't provide enough information
  protected getRawTypeDef(type: string) {
    const instance = createType(type as any)
    return getTypeDef(instance.toRawType())
  }

  // Prettifier for type names which are actually JSON strings
  protected prettifyJsonTypeName(json: string) {
    const obj = JSON.parse(json) as { [key: string]: string }
    return (
      '{\n' +
      Object.keys(obj)
        .map((prop) => `  ${prop}${chalk.white(':' + obj[prop])}`)
        .join('\n') +
      '\n}'
    )
  }

  // Get param name based on TypeDef object
  protected paramName(typeDef: TypeDef) {
    return chalk.green(
      typeDef.displayName ||
        typeDef.name ||
        (typeDef.type.startsWith('{') ? this.prettifyJsonTypeName(typeDef.type) : typeDef.type)
    )
  }

  // Prompt for simple/plain value (provided as string) of given type
  async promptForSimple(typeDef: TypeDef, paramOptions?: ApiParamOptions): Promise<Codec> {
    // If no default provided - get default value resulting from providing empty string
    const defaultValueString =
      paramOptions?.value?.default?.toString() || createType(typeDef.type as any, '').toString()
    const providedValue = await this.simplePrompt({
      message: `Provide value for ${this.paramName(typeDef)}`,
      type: 'input',
      // We want to avoid showing default value like '0x', because it falsely suggests
      // that user needs to provide the value as hex
      default: (defaultValueString === '0x' ? '' : defaultValueString) || undefined,
      validate: paramOptions?.validator,
    })
    return createType(typeDef.type as any, providedValue)
  }

  // Prompt for Option<Codec> value
  async promptForOption(typeDef: TypeDef, paramOptions?: ApiParamOptions): Promise<Option<Codec>> {
    const subtype = typeDef.sub as TypeDef // We assume that Opion always has a single subtype
    const defaultValue = paramOptions?.value?.default as Option<Codec> | undefined
    const confirmed = await this.simplePrompt({
      message: `Do you want to provide the optional ${this.paramName(typeDef)} parameter?`,
      type: 'confirm',
      default: defaultValue ? defaultValue.isSome : false,
    })

    if (confirmed) {
      this.openIndentGroup()
      const value = await this.promptForParam(
        subtype.type,
        createParamOptions(subtype.name, defaultValue?.unwrapOr(undefined))
      )
      this.closeIndentGroup()
      return new Option(subtype.type as any, value)
    }

    return new Option(subtype.type as any, null)
  }

  // Prompt for Tuple
  // TODO: Not well tested yet
  async promptForTuple(typeDef: TypeDef, paramOptions?: ApiParamOptions): Promise<Tuple> {
    console.log(chalk.grey(`Providing values for ${this.paramName(typeDef)} tuple:`))

    this.openIndentGroup()
    const result: ApiMethodArg[] = []
    // We assume that for Tuple there is always at least 1 subtype (pethaps it's even always an array?)
    const subtypes: TypeDef[] = Array.isArray(typeDef.sub) ? typeDef.sub! : [typeDef.sub!]
    const defaultValue = paramOptions?.value?.default as Tuple | undefined

    for (const [index, subtype] of Object.entries(subtypes)) {
      const entryDefaultVal = defaultValue && defaultValue[parseInt(index)]
      const inputParam = await this.promptForParam(subtype.type, createParamOptions(subtype.name, entryDefaultVal))
      result.push(inputParam)
    }
    this.closeIndentGroup()

    return new Tuple(subtypes.map((subtype) => subtype.type) as any, result)
  }

  // Prompt for Struct
  async promptForStruct(typeDef: TypeDef, paramOptions?: ApiParamOptions): Promise<ApiMethodArg> {
    console.log(chalk.grey(`Providing values for ${this.paramName(typeDef)} struct:`))

    this.openIndentGroup()
    const structType = typeDef.type
    const rawTypeDef = this.getRawTypeDef(structType)
    // We assume struct typeDef always has array of typeDefs inside ".sub"
    const structSubtypes = rawTypeDef.sub as TypeDef[]
    const structDefault = paramOptions?.value?.default as Struct | undefined

    const structValues: { [key: string]: ApiMethodArg } = {}
    for (const subtype of structSubtypes) {
      const fieldOptions = paramOptions?.nestedOptions && paramOptions.nestedOptions[subtype.name!]
      const fieldDefaultValue = fieldOptions?.value?.default || (structDefault && structDefault.get(subtype.name!))
      const finalFieldOptions: ApiParamOptions = {
        forcedName: subtype.name,
        ...fieldOptions, // "forcedName" above should be overriden with "fieldOptions.forcedName" if available
        value: fieldDefaultValue && { ...fieldOptions?.value, default: fieldDefaultValue },
      }
      structValues[subtype.name!] = await this.promptForParam(subtype.type, finalFieldOptions)
    }
    this.closeIndentGroup()

    return createType(structType as any, structValues)
  }

  // Prompt for Vec
  async promptForVec(typeDef: TypeDef, paramOptions?: ApiParamOptions): Promise<Vec<Codec>> {
    console.log(chalk.grey(`Providing values for ${this.paramName(typeDef)} vector:`))

    this.openIndentGroup()
    // We assume Vec always has one TypeDef as ".sub"
    const subtype = typeDef.sub as TypeDef
    const defaultValue = paramOptions?.value?.default as Vec<Codec> | undefined
    const entries: Codec[] = []
    let addAnother = false
    do {
      addAnother = await this.simplePrompt({
        message: `Do you want to add another entry to ${this.paramName(typeDef)} vector (currently: ${
          entries.length
        })?`,
        type: 'confirm',
        default: defaultValue ? entries.length < defaultValue.length : false,
      })
      const defaultEntryValue = defaultValue && defaultValue[entries.length]
      if (addAnother) {
        entries.push(await this.promptForParam(subtype.type, createParamOptions(subtype.name, defaultEntryValue)))
      }
    } while (addAnother)
    this.closeIndentGroup()

    return new Vec(subtype.type as any, entries)
  }

  // Prompt for Enum
  async promptForEnum(typeDef: TypeDef, paramOptions?: ApiParamOptions): Promise<Enum> {
    const enumType = typeDef.type
    const rawTypeDef = this.getRawTypeDef(enumType)
    // We assume enum always has array on TypeDefs inside ".sub"
    const enumSubtypes = rawTypeDef.sub as TypeDef[]
    const defaultValue = paramOptions?.value?.default as Enum | undefined

    const enumSubtypeName = await this.simplePrompt({
      message: `Choose value for ${this.paramName(typeDef)}:`,
      type: 'list',
      choices: enumSubtypes.map((subtype) => ({
        name: subtype.name,
        value: subtype.name,
      })),
      default: defaultValue?.type,
    })

    const enumSubtype = enumSubtypes.find((st) => st.name === enumSubtypeName)!

    if (enumSubtype.type !== 'Null') {
      const subtypeOptions = createParamOptions(enumSubtype.name, defaultValue?.value)
      return createType(enumType as any, {
        [enumSubtype.name!]: await this.promptForParam(enumSubtype.type, subtypeOptions),
      })
    }

    return createType(enumType as any, enumSubtype.name)
  }

  // Prompt for param based on "paramType" string (ie. Option<MemeberId>)
  // TODO: This may not yet work for all possible types
  async promptForParam(
    paramType: string,
    paramOptions?: ApiParamOptions // TODO: This is not fully implemented for all types yet
  ): Promise<ApiMethodArg> {
    const typeDef = getTypeDef(paramType)
    const rawTypeDef = this.getRawTypeDef(paramType)

    if (paramOptions?.forcedName) {
      typeDef.name = paramOptions.forcedName
    }

    if (paramOptions?.value?.locked) {
      return paramOptions.value.default
    }

    if (paramOptions?.jsonSchema) {
      const { struct, schemaValidator } = paramOptions.jsonSchema
      return await this.promptForJsonBytes(
        struct,
        typeDef.name,
        paramOptions.value?.default as Bytes | undefined,
        schemaValidator
      )
    }

    if (rawTypeDef.info === TypeDefInfo.Option) {
      return await this.promptForOption(typeDef, paramOptions)
    } else if (rawTypeDef.info === TypeDefInfo.Tuple) {
      return await this.promptForTuple(typeDef, paramOptions)
    } else if (rawTypeDef.info === TypeDefInfo.Struct) {
      return await this.promptForStruct(typeDef, paramOptions)
    } else if (rawTypeDef.info === TypeDefInfo.Enum) {
      return await this.promptForEnum(typeDef, paramOptions)
    } else if (rawTypeDef.info === TypeDefInfo.Vec) {
      return await this.promptForVec(typeDef, paramOptions)
    } else {
      return await this.promptForSimple(typeDef, paramOptions)
    }
  }

  async promptForJsonBytes(
    jsonStruct: Constructor<Struct>,
    argName?: string,
    defaultValue?: Bytes,
    schemaValidator?: ajv.ValidateFunction
  ) {
    const rawType = new jsonStruct().toRawType()
    const typeDef = getTypeDef(rawType)

    const defaultStruct =
      defaultValue && new jsonStruct(JSON.parse(Buffer.from(defaultValue.toHex().replace('0x', ''), 'hex').toString()))

    if (argName) {
      typeDef.name = argName
    }

    let isValid = true,
      jsonText: string
    do {
      const structVal = await this.promptForStruct(typeDef, createParamOptions(typeDef.name, defaultStruct))
      jsonText = JSON.stringify(structVal.toJSON())
      if (schemaValidator) {
        isValid = Boolean(schemaValidator(JSON.parse(jsonText)))
        if (!isValid) {
          this.log('\n')
          this.warn(
            'Schema validation failed with:\n' +
              schemaValidator.errors?.map((e) => chalk.red(`${chalk.bold(e.dataPath)}: ${e.message}`)).join('\n') +
              '\nTry again...'
          )
          this.log('\n')
        }
      }
    } while (!isValid)

    return new Bytes('0x' + Buffer.from(jsonText, 'ascii').toString('hex'))
  }

  async promptForExtrinsicParams(
    module: string,
    method: string,
    paramsOptions?: ApiParamsOptions
  ): Promise<ApiMethodArg[]> {
    const extrinsicMethod = this.getOriginalApi().tx[module][method]
    const values: ApiMethodArg[] = []

    this.openIndentGroup()
    for (const arg of extrinsicMethod.meta.args.toArray()) {
      const argName = arg.name.toString()
      const argType = arg.type.toString()
      let argOptions = paramsOptions && paramsOptions[argName]
      if (!argOptions?.forcedName) {
        argOptions = { ...argOptions, forcedName: argName }
      }
      values.push(await this.promptForParam(argType, argOptions))
    }
    this.closeIndentGroup()

    return values
  }

  sendExtrinsic(account: KeyringPair, module: string, method: string, params: Codec[]) {
    return new Promise((resolve, reject) => {
      const extrinsicMethod = this.getOriginalApi().tx[module][method]
      let unsubscribe: () => void
      extrinsicMethod(...params)
        .signAndSend(account, {}, (result: SubmittableResultImpl) => {
          // Implementation loosely based on /pioneer/packages/react-signer/src/Modal.tsx
          if (!result || !result.status) {
            return
          }

          if (result.status.isFinalized) {
            unsubscribe()
            result.events
              .filter(({ event: { section } }): boolean => section === 'system')
              .forEach(({ event: { method } }): void => {
                if (method === 'ExtrinsicFailed') {
                  reject(new ExtrinsicFailedError('Extrinsic execution error!'))
                } else if (method === 'ExtrinsicSuccess') {
                  resolve()
                }
              })
          } else if (result.isError) {
            reject(new ExtrinsicFailedError('Extrinsic execution error!'))
          }
        })
        .then((unsubFunc) => (unsubscribe = unsubFunc))
        .catch((e) =>
          reject(new ExtrinsicFailedError(`Cannot send the extrinsic: ${e.message ? e.message : JSON.stringify(e)}`))
        )
    })
  }

  async sendAndFollowExtrinsic(
    account: KeyringPair,
    module: string,
    method: string,
    params: Codec[],
    warnOnly = false // If specified - only warning will be displayed (instead of error beeing thrown)
  ) {
    try {
      this.log(chalk.white(`\nSending ${module}.${method} extrinsic...`))
      await this.sendExtrinsic(account, module, method, params)
      this.log(chalk.green(`Extrinsic successful!`))
    } catch (e) {
      if (e instanceof ExtrinsicFailedError && warnOnly) {
        this.warn(`${module}.${method} extrinsic failed! ${e.message}`)
      } else if (e instanceof ExtrinsicFailedError) {
        throw new CLIError(`${module}.${method} extrinsic failed! ${e.message}`, { exit: ExitCodes.ApiError })
      } else {
        throw e
      }
    }
  }

  async buildAndSendExtrinsic(
    account: KeyringPair,
    module: string,
    method: string,
    paramsOptions: ApiParamsOptions,
    warnOnly = false // If specified - only warning will be displayed (instead of error beeing thrown)
  ): Promise<ApiMethodArg[]> {
    const params = await this.promptForExtrinsicParams(module, method, paramsOptions)
    await this.sendAndFollowExtrinsic(account, module, method, params, warnOnly)

    return params
  }

  extrinsicArgsFromDraft(module: string, method: string, draftFilePath: string): ApiMethodNamedArgs {
    let draftJSONObj
    const parsedArgs: ApiMethodNamedArgs = []
    const extrinsicMethod = this.getOriginalApi().tx[module][method]
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      draftJSONObj = require(draftFilePath)
    } catch (e) {
      throw new CLIError(`Could not load draft from: ${draftFilePath}`, { exit: ExitCodes.InvalidFile })
    }
    if (!draftJSONObj || !Array.isArray(draftJSONObj) || draftJSONObj.length !== extrinsicMethod.meta.args.length) {
      throw new CLIError(`The draft file at ${draftFilePath} is invalid!`, { exit: ExitCodes.InvalidFile })
    }
    for (const [index, arg] of Object.entries(extrinsicMethod.meta.args.toArray())) {
      const argName = arg.name.toString()
      const argType = arg.type.toString()
      try {
        parsedArgs.push({ name: argName, value: createType(argType as any, draftJSONObj[parseInt(index)]) })
      } catch (e) {
        throw new CLIError(`Couldn't parse ${argName} value from draft at ${draftFilePath}!`, {
          exit: ExitCodes.InvalidFile,
        })
      }
    }

    return parsedArgs
  }
}
