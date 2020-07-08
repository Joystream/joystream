import { GeneratorContext, VARIANTS_FOLDER } from './SourcesGenerator';
import { UnionType } from '../model/WarthogModel';
import { withNames } from './utils';

export function withUnionType(unionType: UnionType): GeneratorContext {
  return {
    ...withName(unionType),
    ...withTypes(unionType),
  };
}

export function withName(unionType: UnionType): GeneratorContext {
  return {
    name: unionType.name,
  };
}

export function withTypes(unionType: UnionType): GeneratorContext {
  const types: GeneratorContext[] = [];
  unionType.types.map(t => types.push(withNames(t.name)));
  return {
    types,
  };
}

export function withRelativePathForUnions(): GeneratorContext {
  return {
    relativePath: `../${VARIANTS_FOLDER}/unions`,
  };
}
