import { Field, ObjectType } from './WarthogModel';


/**
 * FTSQueryClause represents a single entity/field which 
 * corresponds to a text-based table column in the corresponding database schema.
 * 
 * The clauses are concatenated and stored in a separated db view;
 */
export interface FTSQueryClause {
    entity: ObjectType,
    field: Field 
}

/**
 * Represnts Fulltext search query as defined by
 *  fields in GraphGL  decorated FTSDirective directive
 */
export interface FTSQuery {
    name: string;
    clauses: FTSQueryClause[];
}

