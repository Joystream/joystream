import * as path from 'path';
import { ObjectType, WarthogModel, FieldResolver } from '../model';
import Debug from 'debug';
import { GeneratorContext } from './SourcesGenerator';
import { buildFieldContext } from './field-context';
import * as utils from './utils';
import { GraphQLEnumType } from 'graphql';
import { AbstractRenderer } from './AbstractRenderer';
import { EnumContextProvider } from './EnumContextProvider';

const debug = Debug('qnode-cli:model-renderer');

export class ModelRenderer extends AbstractRenderer {
  private objType: ObjectType;
  private enumCtxProvider: EnumContextProvider;

  constructor(
    model: WarthogModel,
    objType: ObjectType,
    enumContextProvider: EnumContextProvider,
    context: GeneratorContext = {}
  ) {
    super(model, context);
    this.objType = objType;
    this.enumCtxProvider = enumContextProvider;
  }

  withInterfaceProp(): GeneratorContext {
    return {
      isInterface: this.objType.isInterface,
    };
  }

  withInterfaces(): GeneratorContext {
    if (utils.hasInterfaces(this.objType) && this.objType.interfaces !== undefined) {
      return {
        interfaces: [utils.withNames(this.objType.interfaces[0].name)],
      };
    }
    return {};
  }

  withSubclasses(): GeneratorContext {
    if (this.objType.isInterface !== true) {
      return {};
    }
    const subclasses: GeneratorContext[] = [];
    this.model.getSubclasses(this.objType.name).map(o => subclasses.push(utils.withNames(o.name)));
    return {
      subclasses,
    };
  }

  withEnums(): GeneratorContext {
    // we need to have a state to render exports only once
    const referncedEnums = new Set<GraphQLEnumType>();
    this.objType.fields.map(f => {
      if (f.isEnum()) referncedEnums.add(this.model.lookupEnum(f.type));
    });
    const enums: GeneratorContext[] = [];
    for (const e of referncedEnums) {
      enums.push(this.enumCtxProvider.withEnum(e));
    }
    return {
      enums,
    };
  }

  withFields(): GeneratorContext {
    const fields: GeneratorContext[] = [];

    utils.ownFields(this.objType).map(f => fields.push(buildFieldContext(f, this.objType)));
    return {
      fields,
    };
  }

  withDescription(): GeneratorContext {
    return {
      description: this.objType.description || undefined,
    };
  }

  withHasProps(): GeneratorContext {
    const has: GeneratorContext = {};
    for (const field of this.objType.fields) {
      let ct = field.columnType();
      if (ct === 'numeric' || ct === 'decimal') ct = 'numeric';
      has[ct] = true;
    }
    has['array'] = this.objType.fields.some(f => f.isArray());
    has['enum'] = this.objType.fields.some(f => f.isEnum());
    has['union'] = this.objType.fields.some(f => f.isUnion());

    debug(`ObjectType has: ${JSON.stringify(has, null, 2)}`);

    return {
      has,
    };
  }

  withImportProps(): GeneratorContext {
    const relatedEntityImports: Set<string> = new Set();

    this.objType.fields
      .filter(f => f.relation)
      .forEach(f =>
        relatedEntityImports.add(
          path.join(
            `import { ${f.relation?.columnType || ''} } from  '..`,
            utils.kebabCase(f.relation?.columnType),
            `${utils.kebabCase(f.relation?.columnType)}.model'`
          )
        )
      );
    return {
      relatedEntityImports: Array.from(relatedEntityImports.values()),
    };
  }

  withFieldResolvers(): GeneratorContext {
    const fieldResolvers: FieldResolver[] = [];
    const fieldResolverImports: Set<string> = new Set();
    const entityName = this.objType.name;

    for (const f of this.objType.fields) {
      if (!f.relation) continue;
      const returnTypeFunc = f.relation.columnType;
      fieldResolvers.push({
        returnTypeFunc,
        rootArgType: entityName,
        fieldName: f.name,
        rootArgName: utils.camelCase(entityName),
        returnType: utils.generateResolverReturnType(returnTypeFunc, f.isList),
      });
      fieldResolverImports.add(utils.generateEntityImport(returnTypeFunc));
    }
    const imports = Array.from(fieldResolverImports.values());
    // If there is at least one field resolver then add typeorm to imports
    imports.length ? imports.push(`import { getConnection } from 'typeorm';`) : null;
    return {
      fieldResolvers,
      fieldResolverImports: imports,
    };
  }

  transform(): GeneratorContext {
    return {
      ...this.context, //this.getGeneratedFolderRelativePath(objType.name),
      ...this.withFields(),
      ...this.withEnums(),
      ...this.withInterfaces(),
      ...this.withInterfaceProp(),
      ...this.withHasProps(),
      ...this.withSubclasses(),
      ...this.withDescription(),
      ...this.withImportProps(),
      ...this.withFieldResolvers(),
      ...utils.withNames(this.objType.name),
    };
  }
}
