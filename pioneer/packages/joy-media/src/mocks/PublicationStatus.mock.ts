import { newEntityId } from './EntityId.mock';
import { PublicationStatusType } from '../schemas/general/PublicationStatus';

function newEntity (value: string): PublicationStatusType {
  return { id: newEntityId(), value } as unknown as PublicationStatusType; // A hack to fix TS compilation.
}

export const PublicationStatus = {
  Publiс: newEntity('Publiс'),
  Unlisted: newEntity('Unlisted')
};

export const AllPublicationStatuses: PublicationStatusType[] =
  Object.values(PublicationStatus);

export const DefaultPublicationStatus = PublicationStatus.Publiс;
