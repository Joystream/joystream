import { upperFirst, kebabCase, camelCase } from 'lodash';
import { GeneratorContext } from './SourcesGenerator';

export { upperFirst, kebabCase, camelCase };
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

export function names(name: string): { [key: string]: string } {
  return {
    className: pascalCase(name),
    camelName: camelCase(name),
    kebabName: kebabCase(name),
    relClassName: pascalCase(name),
    relCamelName: camelCase(name),
    // Not proper pluralization, but good enough and easy to fix in generated code
    camelNamePlural: camelPlural(name),
  };
}

export function withNames(name: string): GeneratorContext {
  return {
    ...names(name),
  };
}
