import { FieldDefinitionNode, StringValueNode } from 'graphql';
import { Field, WarthogModel } from '../model';
import { DERIVED_FROM_DIRECTIVE } from './constant';

export function addDerivedFromIfy(fieldDef: FieldDefinitionNode, field: Field): void {
  const d = fieldDef.directives?.find(d => d.name.value === DERIVED_FROM_DIRECTIVE);
  if (!d) return;

  if (!d.arguments) {
    throw new Error(`@${DERIVED_FROM_DIRECTIVE} should have a field argument`);
  }

  const directiveArgs = d.arguments.find(arg => arg.name.value === 'field' && arg.value.kind === 'StringValue');

  // TODO: graphql-js already throw error??
  if (!directiveArgs) {
    throw new Error(`@${DERIVED_FROM_DIRECTIVE} should have a single field argument with a sting value`);
  }

  field.derivedFrom = { argument: (directiveArgs.value as StringValueNode).value };
}

export function validateDerivedFields(model: WarthogModel): void {
  model.types.forEach(objType => {
    objType.fields.forEach(f => {
      if (!f.derivedFrom) return;

      if (f.isScalar()) {
        throw new Error('Derived field type is not an entity type');
      }
      if (!model.lookupField(f.type, f.derivedFrom?.argument)) {
        throw new Error('Derived field does not exists on the related type');
      }
    });
  });
}
