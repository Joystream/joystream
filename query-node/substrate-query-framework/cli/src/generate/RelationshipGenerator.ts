import { WarthogModel, Field, ObjectType, makeRelation } from '../model';
import { generateJoinColumnName, generateJoinTableName } from './utils';
import { camelCase } from 'lodash';

export class RelationshipGenerator {
  private _visited: string[];
  model: WarthogModel;

  constructor(model: WarthogModel) {
    this.model = model;
    this._visited = [];
  }

  addMany2Many(field: Field, relatedField: Field, currentObject: ObjectType, relatedObject: ObjectType): void {
    field.relation = makeRelation('mtm', field.type, relatedField.name);
    field.relation.joinTable = {
      tableName: generateJoinTableName(currentObject.name, relatedObject.name),
      joinColumn: generateJoinColumnName(currentObject.name),
      inverseJoinColumn: generateJoinColumnName(relatedObject.name),
    };
    relatedField.relation = makeRelation('mtm', relatedField.type, field.name);

    this.addRelatedImport(currentObject, relatedObject);
    this.addToVisited(...[currentObject.name.concat(field.name), relatedObject.name.concat(relatedField.name)]);
  }

  addOne2Many(field: Field, relatedField: Field, currentObject: ObjectType, relatedObject: ObjectType): void {
    field.relation = makeRelation('otm', field.type, relatedField.name);
    relatedField.relation = makeRelation('mto', relatedField.type, field.name);

    this.addRelatedImport(currentObject, relatedObject);
    this.addToVisited(...[currentObject.name.concat(field.name), relatedObject.name.concat(relatedField.name)]);
  }

  addMany2One(field: Field, currentObject: ObjectType, relatedObject: ObjectType, relatedField: Field): void {
    if (!relatedField.type) {
      // Additinal field for field resolver
      const fname = camelCase(currentObject.name).concat('s');
      relatedField = new Field(fname, relatedObject.name, field.nullable, false, true);
      relatedField.relation = makeRelation('otm', currentObject.name, field.name);
      relatedObject.fields.push(relatedField);
    } else {
      relatedField.relation = makeRelation('otm', currentObject.name, field.name);
    }

    field.relation = makeRelation('mto', field.type, relatedField.name);

    this.addRelatedImport(currentObject, relatedObject);
    this.addToVisited(...[currentObject.name.concat(field.name), relatedObject.name.concat(relatedField.name)]);
  }

  addOne2One(field: Field, relatedField: Field, currentObject: ObjectType, relatedObject: ObjectType): void {
    field.relation = makeRelation('oto', field.type, relatedField.name);
    field.relation.joinColumn = true;
    relatedField.relation = makeRelation('oto', relatedField.type, field.name);

    this.addRelatedImport(currentObject, relatedObject);
    this.addToVisited(...[currentObject.name.concat(field.name), relatedObject.name.concat(relatedField.name)]);
  }

  addToVisited(...args: string[]): void {
    this._visited.push(...args);
  }

  isVisited(f: Field, o: ObjectType): boolean {
    return this._visited.includes(o.name.concat(f.name));
  }

  addRelatedImport(o1: ObjectType, o2: ObjectType): void {
    o1.relatedEntityImports.add(o2.name);
    o2.relatedEntityImports.add(o1.name);
  }

  generate(): void {
    this.model.types.forEach(currentObject => {
      for (const field of currentObject.fields) {
        if (this.isVisited(field, currentObject)) continue;

        // ============= Case 1 =============
        if (!field.isBuildinType && field.derivedFrom) {
          const relatedObject = this.model.lookupType(field.type);
          const relatedField = this.model.lookupField(field.type, field.derivedFrom.argument);

          if (relatedField.derivedFrom) {
            throw new Error(
              `${relatedObject.name}->${relatedField.name} derived field can not reference to another derived field!`
            );
          }

          if (field.isList && relatedField.isList) {
            return this.addMany2Many(field, relatedField, currentObject, relatedObject);
          } else if (field.isList && !relatedField.isList) {
            return this.addOne2Many(field, relatedField, currentObject, relatedObject);
          }
          return this.addOne2One(field, relatedField, currentObject, relatedObject);
        }

        if (!field.isScalar() && !field.derivedFrom) {
          const relatedObject = this.model.lookupType(field.type);
          const relatedFields = relatedObject.fields.filter(f => f.type === currentObject.name);

          if (relatedFields.length === 0) {
            return this.addMany2One(field, currentObject, relatedObject, {} as Field);
          } else {
            const derivedFields = relatedFields.filter(f => f.derivedFrom?.argument === field.name);
            if (derivedFields.length === 0) {
              throw new Error(
                `Incorrect one to one relationship. '${relatedObject.name}' should have a derived field 
                with @derivedFrom(field: "${field.name}") directive`
              );
            } else if (derivedFields.length === 1) {
              if (!derivedFields[0].isList) {
                return this.addOne2One(field, derivedFields[0], currentObject, relatedObject);
              } else {
                return this.addMany2One(field, currentObject, relatedObject, derivedFields[0]);
              }
            } else {
              throw new Error(
                `Found multiple derived fields with same argument -> @derivedField(field:"${field.name}")`
              );
            }
          }
        }

        // ============= Case 3 =============
        if (!field.isBuildinType && field.isList) {
          const relatedObject = this.model.lookupType(field.type);
          const relatedFields = relatedObject.fields.filter(f => f.type === currentObject.name && f.isList);

          if (relatedFields.length !== 1) {
            throw new Error(`Incorrect ManyToMany relationship detected! ${currentObject.name} -> ${field.name}
            found ${relatedFields.length} fields on ${relatedObject.name} of list type`);
          }
          if (!relatedFields[0].derivedFrom) {
            throw new Error(`Incorrect ManyToMany relationship detected! @derived directive
            for ${relatedObject.name}->${relatedFields[0].name} not found`);
          }
          return this.addMany2Many(field, relatedFields[0], currentObject, relatedObject);
        }
      }
    });
  }
}
