import { Enum, Struct, Option, Vec as Vector, H256 } from '@polkadot/types';
import { getTypeRegistry, u32, u64, bool, Text, GenericAccountId } from '@polkadot/types';
import { BlockNumber, Moment, AccountId } from '@polkadot/types/interfaces';
import { OptionText } from './';

import { randomAsU8a } from '@polkadot/util-crypto';
import { encodeAddress, decodeAddress } from '@polkadot/keyring';
// import { u8aToString, stringToU8a } from '@polkadot/util';

export class ContentId extends H256 {
  static generate (): ContentId {
    // randomAsU8a uses https://www.npmjs.com/package/tweetnacl#random-bytes-generation
    return new ContentId(randomAsU8a());
  }

  static decode (contentId: string): ContentId {
    return new ContentId(decodeAddress(contentId));
  }

  static encode (contentId: Uint8Array): string {
    // console.log('contentId:', Buffer.from(contentId).toString('hex'))
    return encodeAddress(contentId);
  }

  encode (): string {
    return ContentId.encode(this);
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
      block: u32, // BlockNumber
      time: u64, // Moment
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

export class OptionVecContentId extends Option.with(VecContentId) {}
export class OptionSchemaId extends Option.with(SchemaId) {}
export class OptionContentVisibility extends Option.with(ContentVisibility) {}
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
      owner: GenericAccountId,
      added_at: BlockAndTime,
      type_id: DataObjectTypeId,
      size: u64,
      liaison: GenericAccountId,
      liaison_judgement: LiaisonJudgement,
      ipfs_content_id: Text,
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

  get ipfs_content_id () : Text {
    return this.get('ipfs_content_id') as Text
  }
}

export class DataObjectStorageRelationship extends Struct {
  constructor (value?: any) {
    super({
      content_id: ContentId,
      storage_provider: GenericAccountId,
      ready: bool
    }, value);
  }

  get content_id (): ContentId {
    return this.get('content_id') as ContentId;
  }

  get storage_provider (): AccountId {
    return this.get('storage_provider') as AccountId;
  }

  get ready (): bool {
    return this.get('ready') as bool;
  }
}

export class DataObjectType extends Struct {
  constructor (value?: any) {
    super({
      description: Text,
      active: bool
    }, value);
  }

  get description (): Text {
    return this.get('description') as Text;
  }

  get active (): bool {
    return this.get('active') as bool;
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
      consumer: GenericAccountId,
      distributor: GenericAccountId,
      initiated_at_block: u32, // BlockNumber,
      initiated_at_time: u64, // Moment
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
      // SchemaId, // This isn't required? (its what caused issue with type mismatch in permissions module!)
      ContentId,
      ContentVisibility,
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
