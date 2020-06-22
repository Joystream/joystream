import { GeneratorContext } from './SourcesGenerator';
import { Field, ObjectType } from '../model';
import * as util from './utils';
import { withRelativePathForEnum } from './enum-context';
import { fieldTypes } from '../helpers/tsTypes';

export const TYPE_FIELDS: { [key: string]: { [key: string]: string } } = {
  bool: {
    decorator: 'BooleanField',
    tsType: 'boolean',
  },
  date: {
    decorator: 'DateField',
    tsType: 'Date',
  },
  int: {
    decorator: 'IntField',
    tsType: 'number',
  },
  float: {
    decorator: 'FloatField',
    tsType: 'number',
  },
  json: {
    decorator: 'JSONField',
    tsType: 'JsonObject',
  },
  otm: {
    decorator: 'OneToMany',
    tsType: '---',
  },
  mto: {
    decorator: 'ManyToOne',
    tsType: '---',
  },
  mtm: {
    decorator: 'ManyToMany',
    tsType: '---',
  },
  string: {
    decorator: 'StringField',
    tsType: 'string',
  },
  numeric: {
    decorator: 'NumericField',
    tsType: 'string',
  },
  decimal: {
    decorator: 'NumericField',
    tsType: 'string',
  },
  oto: {
    decorator: 'OneToOne',
    tsType: '---',
  },
  array: {
    decorator: 'ArrayField',
    tsType: '', // will be updated with the correct type
  },
  bytes: {
    decorator: 'BytesField',
    tsType: 'Buffer',
  },
};

const graphQLFieldTypes: { [key: string]: string } = {
  bool: 'boolean',
  int: 'integer',
  string: 'string',
  float: 'float',
  date: 'date',
  numeric: 'numeric',
  decimal: 'numeric',
};

export function buildFieldContext(f: Field, entity: ObjectType): GeneratorContext {
  return {
    ...withFieldTypeGuardProps(f),
    ...withRequired(f),
    ...withUnique(f),
    ...withArrayCustomFieldConfig(f),
    ...withTsTypeAndDecorator(f),
    ...withDerivedNames(f, entity),
    ...withDescription(f),
  };
}

export function withFieldTypeGuardProps(f: Field): GeneratorContext {
  const is: GeneratorContext = {};
  is['array'] = f.isArray();
  is['scalar'] = f.isScalar();
  is['refType'] = f.isRelationType();
  is['enum'] = f.isEnum();

  ['mto', 'oto', 'otm', 'mtm'].map(s => (is[s] = f.relation?.type === s));
  return {
    is: is,
  };
}

export function withRequired(f: Field): GeneratorContext {
  return {
    required: !f.nullable,
  };
}

export function withDescription(f: Field): GeneratorContext {
  return {
    description: f.description,
  };
}

export function withUnique(f: Field): GeneratorContext {
  return {
    unique: f.unique,
  };
}

export function withTsTypeAndDecorator(f: Field): GeneratorContext {
  const fieldType = f.columnType();
  if (TYPE_FIELDS[fieldType]) {
    return {
      ...TYPE_FIELDS[fieldType],
    };
  }

  return {
    tsType: f.type,
  };
}

export function withArrayCustomFieldConfig(f: Field): GeneratorContext {
  if (!f.isArray()) {
    return {};
  }
  const type = f.columnType();
  const apiType = graphQLFieldTypes[type];

  let dbType = apiType;
  if (dbType === 'string') {
    dbType = 'text'; // postgres doesnt have 'string'
  } else if (dbType === 'float') {
    dbType = 'decimal'; // postgres doesnt have 'float'
  }

  return {
    dbType,
    apiType,
  };
}

export function withDerivedNames(f: Field, entity: ObjectType): GeneratorContext {
  return {
    ...util.names(f.name),
    relFieldName: util.camelCase(entity.name),
    relFieldNamePlural: util.camelPlural(entity.name),
  };
}

export function withImport(f: Field): GeneratorContext {
  if (!f.isEnum()) {
    return {};
  }
  return {
    className: f.type,
    ...withRelativePathForEnum(),
  };
}

export function withEntityRelationImports(entity: ObjectType): GeneratorContext {
  return {
    relatedEntityImports: entity.relatedEntityImports,
  };
}

export function withRelation(f: Field): GeneratorContext {
  return {
    relation: f.relation,
  };
}
