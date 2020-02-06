import { newEntityId } from './EntityId.mock';
import { PublicationStatusType } from '../schemas/general/PublicationStatus';

function newEntity (value: string): PublicationStatusType {
  return { id: newEntityId(), value }
}

export const PublicationStatus = {
  Published: newEntity('Published'),
  Unpublished: newEntity('Unpublished'),
};

export const AllPublicationStatuses: PublicationStatusType[] =
  Object.values(PublicationStatus);

export const DefaultPublicationStatus = PublicationStatus.Published;
