import { GeneratorContext } from './SourcesGenerator';
import { withEnum } from './enum-context';
import { GraphQLEnumType } from 'graphql';
import Debug from 'debug';

const debug = Debug('qnode-cli:enum-ctx-provider');

export class EnumContextProvider {
  readonly exported: { [key: string]: boolean } = {};

  withEnum(enumType: GraphQLEnumType): GeneratorContext {
    return {
      ...this.withExport(enumType.name),
      ...withEnum(enumType),
    };
  }

  withExport(enumType: string): GeneratorContext {
    if (!this.exported[enumType]) {
      this.exported[enumType] = true;
      return {
        // wether the enum should be exported in the template. It must be done only once
        export: true,
      };
    }
    debug(`Enum ${enumType} is already exported`);
    return {};
  }

  // withEnums(objType: ObjectType): GeneratorContext {
  //   const referncedEnums = new Set<GraphQLEnumType>();
  //   objType.fields.map(f => {
  //     if (f.isEnum()) referncedEnums.add(this.model.lookupEnum(f.type));
  //   });
  //   const enums: GeneratorContext[] = [];
  //   for (const e of referncedEnums) {
  //     enums.push(this.withEnum(e));
  //   }
  //   debug(`With enums: ${JSON.stringify(enums, null, 2)}`);
  //   return {
  //     enums,
  //   };
  // }
}
