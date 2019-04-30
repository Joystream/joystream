import { Enum, Struct, Option, Vector } from '@polkadot/types/codec';
import { getTypeRegistry, u64, Bool, Text, BlockNumber, Moment, AccountId, Hash } from '@polkadot/types';
import { OptionText } from '@polkadot/joy-utils/types';

import { randomAsU8a } from '@polkadot/util-crypto';
import { encodeAddress, decodeAddress } from '@polkadot/keyring';
import { u8aToHex, u8aToString, stringToU8a } from '@polkadot/util';

/**
 * These ids were generated using UUID v4. Now we use randomBytes() + encodeAddress() for new ids.
 */
// TODO Delete this backward-compatibility when a new version of blockchain launched.
const uuidContentIds = [
  '0x6665306361386561643838662d343533332d393161642d323539383030623561', '0x3033373262333663353061622d343262332d626265342d323931656332313132', '0x3165623638343133326234372d343237392d616632612d653838613161623239', '0x3562353334356161343130302d343731662d393434352d623936353465663238', '0x3632346330363039396534312d346666342d623437342d633338666263646165', '0x3632313637326535336561302d346361622d616361342d643738306133646164', '0x6361343331666135353436312d343533372d396463622d393165326635383732', '0x6666363565326261343231632d343234632d626633322d666130323866626536'
];

export class ContentId extends Hash {

  static generate (): ContentId {
    // randomAsU8a uses https://www.npmjs.com/package/tweetnacl#random-bytes-generation
    return new ContentId(randomAsU8a());
  }

  /** This function is for backward-compatibility with content ids that were generated as UUID. */
  static isUuidFormat (contentId: string | Uint8Array): boolean {
    let hexU8: Uint8Array =
      typeof contentId === 'string'
        ? stringToU8a(contentId)
        : contentId;
    const hex = u8aToHex(hexU8);
    return uuidContentIds.indexOf(hex) >= 0;
  }

  static fromAddress (contentId: string): ContentId {
    return new ContentId(
      ContentId.isUuidFormat(contentId)
        ? stringToU8a(contentId)
        : decodeAddress(contentId)
    );
  }

  static toAddress (contentId: Uint8Array): string {
    return ContentId.isUuidFormat(contentId)
      ? u8aToString(contentId)
      : encodeAddress(contentId);
  }

  toAddress (): string {
    return ContentId.toAddress(this);
  }
}

export class DataObjectTypeId extends u64 {}
export class DataObjectStorageRelationshipId extends u64 {}
export class SchemaId extends u64 {}
export class DownloadSessionId extends u64 {}

export type BlockAndTimeType = {
  block: BlockNumber,
  time: Moment
};

export class BlockAndTime extends Struct {
  constructor (value?: BlockAndTimeType) {
    super({
      block: BlockNumber,
      time: Moment
    }, value);
  }

  get block (): BlockNumber {
    return this.get('block') as BlockNumber;
  }

  get time (): Moment {
    return this.get('time') as Moment;
  }
}

// TODO rename to Draft to Unlisted
export type ContentVisibilityKey = 'Draft' | 'Public';

export class ContentVisibility extends Enum {
  constructor (value?: ContentVisibilityKey) {
    super([
      'Draft',
      'Public'
    ], value);
  }
}

export class VecContentId extends Vector.with(ContentId) {}

export type ContentMetadataJsonV1 = {
  name: string,
  description?: string,
  thumbnail?: string,
  keywords?: string
};

export class ContentMetadata extends Struct {
  constructor (value?: any) {
    super({
      owner: AccountId,
      added_at: BlockAndTime,
      children_ids: VecContentId,
      visibility: ContentVisibility,
      schema: SchemaId,
      json: Text
    }, value);
  }

  get owner (): AccountId {
    return this.get('owner') as AccountId;
  }

  get added_at (): BlockAndTime {
    return this.get('added_at') as BlockAndTime;
  }

  get children_ids (): VecContentId {
    return this.get('children_ids') as VecContentId;
  }

  get visibility (): ContentVisibility {
    return this.get('visibility') as ContentVisibility;
  }

  get schema (): SchemaId {
    return this.get('schema') as SchemaId;
  }

  get json (): Text {
    return this.get('json') as Text;
  }

  parseJson (): ContentMetadataJsonV1 {
    return JSON.parse(this.json.toString());
  }
}

export class OptionVecContentId extends Option.with(VecContentId) {}
export class OptionSchemaId extends Option.with(SchemaId) {}
export class OptionContentVisibility extends Option.with(ContentVisibility) {}

export type ContentMetadataUpdateType = {
  children_ids: OptionVecContentId,
  visibility: OptionContentVisibility,
  schema: OptionSchemaId,
  json: OptionText
};

export class ContentMetadataUpdate extends Struct {
  constructor (value?: ContentMetadataUpdateType) {
    super({
      children_ids: OptionVecContentId,
      visibility: OptionContentVisibility,
      schema: OptionSchemaId,
      json: OptionText
    }, value);
  }
}

export type LiaisonJudgementKey = 'Pending' | 'Accepted' | 'Rejected';

export class LiaisonJudgement extends Enum {
  constructor (value?: LiaisonJudgementKey) {
    super([
      'Pending',
      'Accepted',
      'Rejected'
    ], value);
  }
}

export class DataObject extends Struct {
  constructor (value?: any) {
    super({
      owner: AccountId,
      added_at: BlockAndTime,
      type_id: DataObjectTypeId,
      size: u64,
      liaison: AccountId,
      liaison_judgement: LiaisonJudgement
    }, value);
  }

  get owner (): AccountId {
    return this.get('owner') as AccountId;
  }

  get added_at (): BlockAndTime {
    return this.get('added_at') as BlockAndTime;
  }

  get type_id (): DataObjectTypeId {
    return this.get('type_id') as DataObjectTypeId;
  }

  /** Actually it's 'size', but 'size' is already reserved by a parent class. */
  get size_in_bytes (): u64 {
    return this.get('size') as u64;
  }

  get liaison (): AccountId {
    return this.get('liaison') as AccountId;
  }

  get liaison_judgement (): LiaisonJudgement {
    return this.get('liaison_judgement') as LiaisonJudgement;
  }
}

export class DataObjectStorageRelationship extends Struct {
  constructor (value?: any) {
    super({
      content_id: ContentId,
      storage_provider: AccountId,
      ready: Bool
    }, value);
  }

  get content_id (): ContentId {
    return this.get('content_id') as ContentId;
  }

  get storage_provider (): AccountId {
    return this.get('storage_provider') as AccountId;
  }

  get ready (): Bool {
    return this.get('ready') as Bool;
  }
}

export class DataObjectType extends Struct {
  constructor (value?: any) {
    super({
      description: Text,
      active: Bool
    }, value);
  }

  get description (): Text {
    return this.get('description') as Text;
  }

  get active (): Bool {
    return this.get('active') as Bool;
  }
}

export type DownloadStateKey = 'Started' | 'Ended';

export class DownloadState extends Enum {
  constructor (value?: DownloadStateKey) {
    super([
      'Started',
      'Ended'
    ], value);
  }
}

export class DownloadSession extends Struct {
  constructor (value?: any) {
    super({
      content_id: ContentId,
      consumer: AccountId,
      distributor: AccountId,
      initiated_at_block: BlockNumber,
      initiated_at_time: Moment,
      state: DownloadState,
      transmitted_bytes: u64
    }, value);
  }

  get content_id (): ContentId {
    return this.get('content_id') as ContentId;
  }

  get consumer (): AccountId {
    return this.get('consumer') as AccountId;
  }

  get distributor (): AccountId {
    return this.get('distributor') as AccountId;
  }

  get initiated_at_block (): BlockNumber {
    return this.get('initiated_at_block') as BlockNumber;
  }

  get initiated_at_time (): Moment {
    return this.get('initiated_at_time') as Moment;
  }

  get state (): DownloadState {
    return this.get('state') as DownloadState;
  }

  get transmitted_bytes (): u64 {
    return this.get('transmitted_bytes') as u64;
  }
}

export function registerMediaTypes () {
  try {
    getTypeRegistry().register({
      '::ContentId': ContentId,
      '::DataObjectTypeId': DataObjectTypeId,
      SchemaId,
      ContentId,
      ContentVisibility,
      ContentMetadata,
      ContentMetadataUpdate,
      LiaisonJudgement,
      DataObject,
      DataObjectStorageRelationshipId,
      DataObjectStorageRelationship,
      DataObjectTypeId,
      DataObjectType,
      DownloadState,
      DownloadSessionId,
      DownloadSession
    });
  } catch (err) {
    console.error('Failed to register custom types of media module', err);
  }
}
