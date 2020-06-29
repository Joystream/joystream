import { GraphQLEnumType } from 'graphql';
import { GeneratorContext, ENUMS_FOLDER } from './SourcesGenerator';

export function withEnum(enumType: GraphQLEnumType): GeneratorContext {
  return {
    ...withName(enumType),
    ...withValues(enumType),
  };
}

export function withName(enumType: GraphQLEnumType): GeneratorContext {
  return {
    name: enumType.name,
  };
}

export function withValues(enumType: GraphQLEnumType): GeneratorContext {
  const values: GeneratorContext[] = [];
  enumType.getValues().map(v => values.push({ name: v.name, value: v.value as string }));
  return {
    values,
  };
}

export function withRelativePathForEnum(): GeneratorContext {
  return {
    relativePath: `../${ENUMS_FOLDER}/enums`,
  };
}
