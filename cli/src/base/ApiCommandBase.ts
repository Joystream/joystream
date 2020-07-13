import ExitCodes from '../ExitCodes';
import { CLIError } from '@oclif/errors';
import StateAwareCommandBase from './StateAwareCommandBase';
import Api from '../Api';
import { JSONArgsMapping } from '../Types';
import { getTypeDef, createType, Option, Tuple, Bytes } from '@polkadot/types';
import { Codec, TypeDef, TypeDefInfo, Constructor } from '@polkadot/types/types';
import { Vec, Struct, Enum } from '@polkadot/types/codec';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import chalk from 'chalk';
import { SubmittableResultImpl } from '@polkadot/api/types';
import ajv from 'ajv';

export type ApiMethodInputArg = Codec;

class ExtrinsicFailedError extends Error { };

/**
 * Abstract base class for commands that require access to the API.
 */
export default abstract class ApiCommandBase extends StateAwareCommandBase {
    private api: Api | null = null;

    getApi(): Api {
        if (!this.api) throw new CLIError('Tried to get API before initialization.', { exit: ExitCodes.ApiError });
        return this.api;
    }

    // Get original api for lower-level api calls
    getOriginalApi(): ApiPromise {
        return this.getApi().getOriginalApi();
    }

    async init() {
        await super.init();
        const apiUri: string = this.getPreservedState().apiUri;
        this.api = await Api.create(apiUri);
    }

    // This is needed to correctly handle some structs, enums etc.
    // Where the main typeDef doesn't provide enough information
    protected getRawTypeDef(type: string) {
        const instance = createType(type as any);
        return getTypeDef(instance.toRawType());
    }

    // Prettifier for type names which are actually JSON strings
    protected prettifyJsonTypeName(json: string) {
        const obj = JSON.parse(json) as { [key: string]: string };
        return "{\n"+Object.keys(obj).map(prop => `  ${prop}${chalk.white(':'+obj[prop])}`).join("\n")+"\n}";
    }

    // Get param name based on TypeDef object
    protected paramName(typeDef: TypeDef) {
        return chalk.green(
            typeDef.displayName ||
            typeDef.name ||
            (typeDef.type.startsWith('{') ? this.prettifyJsonTypeName(typeDef.type) : typeDef.type)
        );
    }

    // Prompt for simple/plain value (provided as string) of given type
    async promptForSimple(typeDef: TypeDef, defaultValue?: Codec): Promise<Codec> {
        const providedValue = await this.simplePrompt({
            message: `Provide value for ${ this.paramName(typeDef) }`,
            type: 'input',
            default: defaultValue?.toString()
        });
        return createType(typeDef.type as any, providedValue);
    }

    // Prompt for Option<Codec> value
    async promptForOption(typeDef: TypeDef, defaultValue?: Option<Codec>): Promise<Option<Codec>> {
        const subtype = <TypeDef> typeDef.sub; // We assume that Opion always has a single subtype
        const confirmed = await this.simplePrompt({
            message: `Do you want to provide the optional ${ this.paramName(typeDef) } parameter?`,
            type: 'confirm',
            default: defaultValue ? defaultValue.isSome : false,
        });

        if (confirmed) {
            this.openIndentGroup();
            const value = await this.promptForParam(subtype.type, subtype.name, defaultValue?.unwrapOr(undefined));
            this.closeIndentGroup();
            return new Option(subtype.type as any, value);
        }

        return new Option(subtype.type as any, null);
    }

    // Prompt for Tuple
    // TODO: Not well tested yet
    async promptForTuple(typeDef: TypeDef, defaultValue: Tuple): Promise<Tuple> {
        console.log(chalk.grey(`Providing values for ${ this.paramName(typeDef) } tuple:`));

        this.openIndentGroup();
        const result: ApiMethodInputArg[] = [];
        // We assume that for Tuple there is always at least 1 subtype (pethaps it's even always an array?)
        const subtypes: TypeDef[] = Array.isArray(typeDef.sub) ? typeDef.sub! : [ typeDef.sub! ];

        for (const [index, subtype] of Object.entries(subtypes)) {
            const inputParam = await this.promptForParam(subtype.type, subtype.name, defaultValue[parseInt(index)]);
            result.push(inputParam);
        }
        this.closeIndentGroup();

        return new Tuple((subtypes.map(subtype => subtype.type)) as any, result);
    }

    // Prompt for Struct
    async promptForStruct(typeDef: TypeDef, defaultValue?: Struct): Promise<ApiMethodInputArg> {
        console.log(chalk.grey(`Providing values for ${ this.paramName(typeDef) } struct:`));

        this.openIndentGroup();
        const structType = typeDef.type;
        const rawTypeDef = this.getRawTypeDef(structType);
        // We assume struct typeDef always has array of typeDefs inside ".sub"
        const structSubtypes = rawTypeDef.sub as TypeDef[];

        const structValues: { [key: string]: ApiMethodInputArg } = {};
        for (const subtype of structSubtypes) {
            structValues[subtype.name!] =
                await this.promptForParam(subtype.type, subtype.name, defaultValue && defaultValue.get(subtype.name!));
        }
        this.closeIndentGroup();

        return createType(structType as any, structValues);
    }

    // Prompt for Vec
    async promptForVec(typeDef: TypeDef, defaultValue?: Vec<Codec>): Promise<Vec<Codec>> {
        console.log(chalk.grey(`Providing values for ${ this.paramName(typeDef) } vector:`));

        this.openIndentGroup();
        // We assume Vec always has one TypeDef as ".sub"
        const subtype = typeDef.sub as TypeDef;
        let entries: Codec[] = [];
        let addAnother = false;
        do {
            addAnother = await this.simplePrompt({
                message: `Do you want to add another entry to ${ this.paramName(typeDef) } vector (currently: ${entries.length})?`,
                type: 'confirm',
                default: defaultValue ? entries.length < defaultValue.length : false
            });
            const defaultEntryValue = defaultValue && defaultValue[entries.length];
            if (addAnother) {
                entries.push(await this.promptForParam(subtype.type, subtype.name, defaultEntryValue));
            }
        } while (addAnother);
        this.closeIndentGroup();

        return new Vec(subtype.type as any, entries);
    }

    // Prompt for Enum
    async promptForEnum(typeDef: TypeDef, defaultValue?: Enum): Promise<Enum> {
        const enumType = typeDef.type;
        const rawTypeDef = this.getRawTypeDef(enumType);
        // We assume enum always has array on TypeDefs inside ".sub"
        const enumSubtypes = rawTypeDef.sub as TypeDef[];

        const enumSubtypeName = await this.simplePrompt({
            message: `Choose value for ${this.paramName(typeDef)}:`,
            type: 'list',
            choices: enumSubtypes.map(subtype => ({
                name: subtype.name,
                value: subtype.name
            })),
            default: defaultValue?.type
        });

        const enumSubtype = enumSubtypes.find(st => st.name === enumSubtypeName)!;

        if (enumSubtype.type !== 'Null') {
            return createType(
                enumType as any,
                { [enumSubtype.name!]: await this.promptForParam(enumSubtype.type, enumSubtype.name, defaultValue?.value) }
            );
        }

        return createType(enumType as any, enumSubtype.name);
    }

    // Prompt for param based on "paramType" string (ie. Option<MemeberId>)
    // TODO: This may not yet work for all possible types
    async promptForParam(paramType: string, forcedName?: string, defaultValue?: ApiMethodInputArg): Promise<ApiMethodInputArg> {
        const typeDef = getTypeDef(paramType);
        const rawTypeDef = this.getRawTypeDef(paramType);

        if (forcedName) {
            typeDef.name = forcedName;
        }

        if (rawTypeDef.info === TypeDefInfo.Option) {
            return await this.promptForOption(typeDef, defaultValue as Option<Codec>);
        }
        else if (rawTypeDef.info === TypeDefInfo.Tuple) {
            return await this.promptForTuple(typeDef, defaultValue as Tuple);
        }
        else if (rawTypeDef.info === TypeDefInfo.Struct) {
            return await this.promptForStruct(typeDef, defaultValue as Struct);
        }
        else if (rawTypeDef.info === TypeDefInfo.Enum) {
            return await this.promptForEnum(typeDef, defaultValue as Enum);
        }
        else if (rawTypeDef.info === TypeDefInfo.Vec) {
            return await this.promptForVec(typeDef, defaultValue as Vec<Codec>);
        }
        else {
            return await this.promptForSimple(typeDef, defaultValue);
        }
    }

    async promptForJsonBytes(
        JsonStruct: Constructor<Struct>,
        argName?: string,
        defaultValue?: Bytes,
        schemaValidator?: ajv.ValidateFunction
    ) {
        const rawType = (new JsonStruct()).toRawType();
        const typeDef = getTypeDef(rawType);

        const defaultStruct =
            defaultValue &&
            new JsonStruct(JSON.parse(Buffer.from(defaultValue.toHex().replace('0x', ''), 'hex').toString()));

        if (argName) {
            typeDef.name = argName;
        }

        let isValid: boolean = true, jsonText: string;
        do {
            const structVal = await this.promptForStruct(typeDef, defaultStruct);
            jsonText = JSON.stringify(structVal.toJSON());
            if (schemaValidator) {
                isValid = Boolean(schemaValidator(JSON.parse(jsonText)));
                if (!isValid) {
                    this.log("\n");
                    this.warn(
                        "Schema validation failed with:\n"+
                        schemaValidator.errors?.map(e => chalk.red(`${chalk.bold(e.dataPath)}: ${e.message}`)).join("\n")+
                        "\nTry again..."
                    )
                    this.log("\n");
                }
            }
        } while(!isValid);

        return new Bytes('0x'+Buffer.from(jsonText, 'ascii').toString('hex'));
    }

    async promptForExtrinsicParams(
        module: string,
        method: string,
        jsonArgs?: JSONArgsMapping,
        defaultValues?: ApiMethodInputArg[]
    ): Promise<ApiMethodInputArg[]> {
        const extrinsicMethod = this.getOriginalApi().tx[module][method];
        let values: ApiMethodInputArg[] = [];

        this.openIndentGroup();
        for (const [index, arg] of Object.entries(extrinsicMethod.meta.args.toArray())) {
            const argName = arg.name.toString();
            const argType = arg.type.toString();
            const defaultValue = defaultValues && defaultValues[parseInt(index)];
            if (jsonArgs && jsonArgs[argName]) {
                const { struct, schemaValidator } = jsonArgs[argName];
                values.push(await this.promptForJsonBytes(struct, argName, defaultValue as Bytes, schemaValidator));
            }
            else {
                values.push(await this.promptForParam(argType, argName, defaultValue));
            }
        };
        this.closeIndentGroup();

        return values;
    }

    sendExtrinsic(account: KeyringPair, module: string, method: string, params: Codec[]) {
        return new Promise((resolve, reject) => {
            const extrinsicMethod = this.getOriginalApi().tx[module][method];
            let unsubscribe: () => void;
            extrinsicMethod(...params)
                .signAndSend(account, {}, (result: SubmittableResultImpl) => {
                    // Implementation loosely based on /pioneer/packages/react-signer/src/Modal.tsx
                    if (!result || !result.status) {
                        return;
                    }

                    if (result.status.isFinalized) {
                      unsubscribe();
                      result.events
                        .filter(({ event: { section } }): boolean => section === 'system')
                        .forEach(({ event: { method } }): void => {
                          if (method === 'ExtrinsicFailed') {
                            reject(new ExtrinsicFailedError('Extrinsic execution error!'));
                          } else if (method === 'ExtrinsicSuccess') {
                            resolve();
                          }
                        });
                    } else if (result.isError) {
                        reject(new ExtrinsicFailedError('Extrinsic execution error!'));
                    }
                })
                .then(unsubFunc => unsubscribe = unsubFunc)
                .catch(e => reject(new ExtrinsicFailedError(`Cannot send the extrinsic: ${e.message ? e.message : JSON.stringify(e)}`)));
        });
    }

    async sendAndFollowExtrinsic(
        account: KeyringPair,
        module: string,
        method: string,
        params: Codec[],
        warnOnly: boolean = false // If specified - only warning will be displayed (instead of error beeing thrown)
    ) {
        try {
            this.log(chalk.white(`\nSending ${ module }.${ method } extrinsic...`));
            await this.sendExtrinsic(account, module, method, params);
            this.log(chalk.green(`Extrinsic successful!`));
        } catch (e) {
            if (e instanceof ExtrinsicFailedError && warnOnly) {
                this.warn(`${ module }.${ method } extrinsic failed! ${ e.message }`);
            }
            else if (e instanceof ExtrinsicFailedError) {
                throw new CLIError(`${ module }.${ method } extrinsic failed! ${ e.message }`, { exit: ExitCodes.ApiError });
            }
            else {
                throw e;
            }
        }
    }

    async buildAndSendExtrinsic(
        account: KeyringPair,
        module: string,
        method: string,
        jsonArgs?: JSONArgsMapping, // Special JSON arguments (ie. human_readable_text of working group opening)
        defaultValues?: ApiMethodInputArg[],
        warnOnly: boolean = false // If specified - only warning will be displayed (instead of error beeing thrown)
    ): Promise<ApiMethodInputArg[]> {
        const params = await this.promptForExtrinsicParams(module, method, jsonArgs, defaultValues);
        await this.sendAndFollowExtrinsic(account, module, method, params, warnOnly);

        return params;
    }

    extrinsicArgsFromDraft(module: string, method: string, draftFilePath: string): ApiMethodInputArg[] {
        let draftJSONObj, parsedArgs: ApiMethodInputArg[] = [];
        const extrinsicMethod = this.getOriginalApi().tx[module][method];
        try {
            draftJSONObj = require(draftFilePath);
        } catch(e) {
            throw new CLIError(`Could not load draft from: ${draftFilePath}`, { exit: ExitCodes.InvalidFile });
        }
        if (
            !draftJSONObj
            || !Array.isArray(draftJSONObj)
            || draftJSONObj.length !== extrinsicMethod.meta.args.length
        ) {
            throw new CLIError(`The draft file at ${draftFilePath} is invalid!`, { exit: ExitCodes.InvalidFile });
        }
        for (const [index, arg] of Object.entries(extrinsicMethod.meta.args.toArray())) {
            const argName = arg.name.toString();
            const argType = arg.type.toString();
            try {
                parsedArgs.push(createType(argType as any, draftJSONObj[parseInt(index)]));
            } catch (e) {
                throw new CLIError(`Couldn't parse ${argName} value from draft at ${draftFilePath}!`, { exit: ExitCodes.InvalidFile });
            }
        }

        return parsedArgs;
    }
}
