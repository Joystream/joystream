import Mustache from 'mustache';
import { Field, ObjectType } from '../model';
import * as path from 'path';
import { kebabCase } from 'lodash';
import { getTypesForArray, names } from './utils';
import Debug from "debug";
import { GeneratorContext } from './SourcesGenerator';

const debug = Debug('qnode-cli:model-renderer');

const TYPE_FIELDS: { [key: string]: { [key: string]: string } } = {
  bool: {
    decorator: 'BooleanField',
    tsType: 'boolean'
  },
  date: {
    decorator: 'DateField',
    tsType: 'Date'
  },
  int: {
    decorator: 'IntField',
    tsType: 'number'
  },
  float: {
    decorator: 'FloatField',
    tsType: 'number'
  },
  json: {
    decorator: 'JSONField',
    tsType: 'JsonObject'
  },
  otm: {
    decorator: 'OneToMany',
    tsType: '---'
  },
  string: {
    decorator: 'StringField',
    tsType: 'string'
  },
  numeric: {
    decorator: 'NumericField',
    tsType: 'string'
  },
  decimal: {
    decorator: 'NumericField',
    tsType: 'string'
  },
  oto: {
    decorator: 'OneToOne',
    tsType: '---'
  },
  array: {
    decorator: 'ArrayField',
    tsType: '' // will be updated with the correct type
  },
  bytes: {
    decorator: 'BytesField',
    tsType: 'Buffer'
  }
};

type FunctionProp = () => string;
type MustacheProp = string | FunctionProp;


export interface MustacheObjectType {
  generatedFolderRelPath: string,
  className: string
  fields: MustacheField[],
  has: Props // hasBooleanField, hasIntField, ...
}

export interface MustacheField {
  camelName: MustacheProp,
  tsType: MustacheProp,
  decorator: MustacheProp,
  relClassName?: string,
  relCamelName?: string,
  relPathForModel?: string,
  apiType?: string,
  dbType?: string,
  required: boolean,
  is: Props // isOtm, isMto, isScalar ...
} 

interface Props {
  [key: string]: boolean | string
}

export class ModelRenderer {

  private context: GeneratorContext = {};

  constructor(context: GeneratorContext = {}) {
    this.context = context;
  }

  transformField(f: Field): MustacheField {
    let ret = {};
    const isProps: Props = {};
    isProps['array'] = f.isBuildinType && f.isList; 
    isProps['scalar'] = f.isBuildinType && !f.isList;
    ['mto', 'oto', 'otm'].map((s) => isProps[s] = (f.type === s));

    isProps['refType'] = isProps['mto'] || isProps['oto'] || isProps['otm'];

    const fieldType = f.columnType();
   
    ret =  {
      is: isProps,
      required: !f.nullable,
      ...TYPE_FIELDS[fieldType]
    };

    if (isProps['array']) {
      ret = {
        ...ret,
        ...getTypesForArray(fieldType),
        decorator: 'ArrayField',
      }
    }

    const fieldNames = (f.type === 'mto') ? names(f.name.slice(0, -1)) : names(f.name);

    ret = {
      ...ret,
      ...fieldNames,
      relPathForModel: this.relativePathForModel(fieldNames['relClassName'])
    }

    debug(`Mustache Field: ${JSON.stringify(ret, null, 2)}`);

    return ret as MustacheField; 
  }

  transform(objType: ObjectType): MustacheObjectType {
    const fields: MustacheField[] = [];
    
    objType.fields.map((f) => fields.push(this.transformField(f)));
    
    const has: Props = {};
    for (const key in TYPE_FIELDS) {
      const _key: string = (key === 'numeric') ? 'numeric' || 'decimal' : key;
      has[key] = objType.fields.some((f) => f.columnType() === _key);
    }

    debug(`ObjectType has: ${JSON.stringify(has, null, 2)}`);

    return { fields, 
            generatedFolderRelPath: this.context["generatedFolderRelPath"] as string, //this.getGeneratedFolderRelativePath(objType.name),
            has,
            ...names(objType.name) } as MustacheObjectType;
  }

  generate(mustacheTeplate: string, objType: ObjectType):string {
    const mustacheQuery = this.transform(objType);
    return Mustache.render(mustacheTeplate, mustacheQuery);
  }

  
  relativePathForModel(referenced: string): string {
    return path.join(
      '..',
      kebabCase(referenced),
      `${kebabCase(referenced)}.model`
    );
  }
}