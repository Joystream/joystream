import { Field, ObjectType } from './WarthogModel';

/**
 * Represnts Fulltext search query as defined by
 *  fields in GraphGL  decorated FTSDirective directive
 */
export interface FTSQuery {
    name: string;
    type?: ObjectType;
    fields: Field[];
}

