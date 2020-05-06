import * as shortid from 'shortid';
import { DeepPartial } from 'typeorm';
/**
 * Fixes compatibility between typeorm and warthog models.
 *
 * @tutorial Warthog add extra properties to its BaseModel and some of these properties are
 * required. This function mutate the entity to make it compatible with warthog models.
 * Warthog throw error if required properties contains null values.
 *
 * @param entity: DeepPartial<T>
 */
export function fillRequiredWarthogFields<T>(entity: DeepPartial<T>): DeepPartial<T> {
  const requiredFields = {
    id: shortid.generate(),
    createdById: shortid.generate(),
    version: 1,
  };
  return Object.assign(entity, requiredFields);
}
