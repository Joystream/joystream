import { Field } from '.';

/**
 * Reperesent GraphQL object type
 */
export interface ObjectType {
  name: string;
  fields: Field[];
  isEntity: boolean;
  relatedEntityImports: Set<string>;
  // Description of the field will be shown in GrapqQL API
  description?: string;
  isInterface?: boolean;
  interfaces?: ObjectType[]; //interface names
}
