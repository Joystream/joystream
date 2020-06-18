import { upperFirst, kebabCase, camelCase } from 'lodash';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export function supplant(str: string, obj: Record<string, unknown>): string {
  return str.replace(/\${([^${}]*)}/g, (a, b) => {
    const r = obj[b];
    return typeof r === 'string' ? r : a;
  });
}

export function pascalCase(str: string): string {
  return upperFirst(camelCase(str));
}

export function camelPlural(str: string): string {
  return `${camelCase(str)}s`;
}

export function getTypesForArray(typeName: string): { [key: string]: string } {
  const graphQLFieldTypes: { [key: string]: string } = {
    bool: 'boolean',
    int: 'integer',
    string: 'string',
    float: 'float',
    date: 'date',
    numeric: 'numeric',
    decimal: 'numeric'
  };
  const apiType = graphQLFieldTypes[typeName];

  let dbType = apiType;
  if (dbType === 'string') {
    dbType = 'text'; // postgres doesnt have 'string'
  } else if (dbType === 'float') {
    dbType = 'decimal'; // postgres doesnt have 'float'
  }

  return { dbType, apiType };
}

export function names(name: string): { [key: string]: string } {
  return {
    className: pascalCase(name),
    camelName: camelCase(name),
    kebabName: kebabCase(name),
    // Not proper pluralization, but good enough and easy to fix in generated code
    camelNamePlural: camelPlural(name)
  }
}