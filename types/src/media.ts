import { Enum, Struct, Option, Vec as Vector, H256 } from '@polkadot/types';
import { getTypeRegistry, u32, u64, bool, Text } from '@polkadot/types';
import { BlockNumber, Moment } from '@polkadot/types/interfaces';
import { StorageProviderId } from './bureaucracy';
import { MemberId } from './members';

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

  static newEmpty (): BlockAndTime {
    return new BlockAndTime({} as BlockAndTime);
  }
}

export class VecContentId extends Vector.with(ContentId) {}
export class OptionVecContentId extends Option.with(VecContentId) {}
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
      owner: MemberId,
      added_at: BlockAndTime,
      type_id: DataObjectTypeId,
      size: u64,
      liaison: StorageProviderId,
      liaison_judgement: LiaisonJudgement,
      ipfs_content_id: Text,
    }, value);
  }

  get owner (): MemberId {
    return this.get('owner') as MemberId;
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

  get liaison (): StorageProviderId {
    return this.get('liaison') as StorageProviderId;
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
      storage_provider: StorageProviderId,
      ready: bool
    }, value);
  }

  get content_id (): ContentId {
    return this.get('content_id') as ContentId;
  }

  get storage_provider (): StorageProviderId {
    return this.get('storage_provider') as StorageProviderId;
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

export function registerMediaTypes () {
  try {
    getTypeRegistry().register({
      '::ContentId': ContentId,
      '::DataObjectTypeId': DataObjectTypeId,
      ContentId,
      LiaisonJudgement,
      DataObject,
      DataObjectStorageRelationshipId,
      DataObjectStorageRelationship,
      DataObjectTypeId,
      DataObjectType,
    });
  } catch (err) {
    console.error('Failed to register custom types of media module', err);
  }
}
