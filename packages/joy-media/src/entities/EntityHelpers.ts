import moment from 'moment';
import { PublicationStatusType } from "../schemas/general/PublicationStatus";
import { CurationStatusType } from "../schemas/general/CurationStatus";
import { PublicationStatus, CurationStatus } from "../mocks";

type HasEntityStatuses = {
  publicationStatus?: PublicationStatusType,
  curationStatus?: CurationStatusType,
}

// TODO values of PublicationStatus and CurationStatus should be loaded from versioned store (Substrate)
export function isPublicEntity(entity: HasEntityStatuses): boolean {
  return (
    entity.publicationStatus?.id === PublicationStatus.Publiс.id &&
    entity.curationStatus?.id !== CurationStatus.UnderReview.id &&
    entity.curationStatus?.id !== CurationStatus.Removed.id
  );
}

export function printExplicit(explicit?: boolean): string {
  return explicit === true ? 'Yes' : 'No'
}

export function printReleaseDate(linuxTimestamp?: number): string {
  return !linuxTimestamp ? '' : moment(linuxTimestamp * 1000).format('YYYY-MM-DD')
}
