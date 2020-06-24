import { WarthogModel, Field, ObjectType } from '../model';

export class RelationshipGenerator {
  visited: Field[];
  model: WarthogModel;

  constructor(model: WarthogModel) {
    this.model = model;
    this.visited = [];
  }

  addMany2Many(field: Field, relatedField: Field, objType: ObjectType, relatedObject: ObjectType): void {
    field.relation = { type: 'mtm', columnType: field.type, joinTable: true, relatedTsProp: relatedField.name };
    relatedField.relation = { type: 'mtm', columnType: relatedField.type, relatedTsProp: field.name };

    objType.relatedEntityImports.add(relatedObject.name);
    relatedObject.relatedEntityImports.add(objType.name);
    this.visited.push(field, relatedField);
  }

  addOne2Many(field: Field, relatedField: Field, objType: ObjectType, relatedObject: ObjectType): void {
    field.relation = { type: 'otm', columnType: field.type, relatedTsProp: relatedField.name };
    relatedField.relation = { type: 'mto', columnType: relatedField.type, relatedTsProp: field.name };

    objType.relatedEntityImports.add(field.type);
    relatedObject.relatedEntityImports.add(objType.name);
    this.visited.push(field, relatedField);
  }

  addMany2One(field: Field, currentObject: ObjectType, relatedObject: ObjectType): void {
    field.relation = { type: 'mto', columnType: field.type };
    currentObject.relatedEntityImports.add(relatedObject.name);
    this.visited.push(field);
  }

  addOne2One(field: Field, relatedField: Field, objType: ObjectType, relatedObject: ObjectType): void {
    field.relation = { type: 'oto', columnType: field.type, joinColumn: true, relatedTsProp: relatedField.name };
    relatedField.relation = { type: 'oto', columnType: relatedField.type, relatedTsProp: field.name };

    objType.relatedEntityImports.add(relatedObject.name);
    relatedObject.relatedEntityImports.add(objType.name);
    this.visited.push(field, relatedField);
  }

  generate(): void {
    this.model.types.forEach(currentObject => {
      currentObject.fields.forEach(field => {
        if (this.visited.includes(field)) return;

        // ============= Case 0 =============
        if (field.derivedFrom && !field.isList) return;

        // ============= Case 1 =============
        if (!field.isBuildinType && field.derivedFrom && field.isList) {
          const relatedObject = this.model.lookupType(field.type);
          // if related field not found lookupField will throw error anyway
          const relatedField = this.model.lookupField(field.type, field.derivedFrom.argument);

          if (relatedField.derivedFrom) {
            throw new Error(
              `${relatedObject.name}->${relatedField.name} derived field can not reference to another derived field!`
            );
          }
          if (relatedField.isList) {
            return this.addMany2Many(field, relatedField, currentObject, relatedObject);
          }
          return this.addOne2Many(field, relatedField, currentObject, relatedObject);
        }

        if (!field.isBuildinType && !field.isList && !field.derivedFrom) {
          const relatedObject = this.model.lookupType(field.type);
          const relatedFields = relatedObject.fields.filter(f => f.type === currentObject.name);

          if (relatedFields.length === 0) {
            return this.addMany2One(field, currentObject, relatedObject);
          } else {
            const derivedFields = relatedFields.filter(f => f.derivedFrom?.argument === field.name);
            if (derivedFields.length === 0) {
              throw new Error(
                `Incorrect one to one relationship. '${relatedObject.name}' should have a derived field with @derivedFrom(field: "${field.name}") directive`
              );
            } else if (derivedFields.length === 1) {
              return this.addOne2One(field, derivedFields[0], currentObject, relatedObject);
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
            for ${relatedObject.name}->${relatedFields[0].name} could not found`);
          }
          return this.addMany2Many(field, relatedFields[0], currentObject, relatedObject);
        }
      });
    });
  }
}
