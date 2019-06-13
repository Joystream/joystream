import { Enum, Struct, Option, Vector } from '@polkadot/types/codec';
import { u64, Bool, Text, BlockNumber, Moment, AccountId, Hash } from '@polkadot/types';
import { OptionText } from './';
export declare class ContentId extends Hash {
    static generate(): ContentId;
    static decode(contentId: string): ContentId;
    static encode(contentId: Uint8Array): string;
    encode(): string;
}
export declare class DataObjectTypeId extends u64 {
}
export declare class DataObjectStorageRelationshipId extends u64 {
}
export declare class SchemaId extends u64 {
}
export declare class DownloadSessionId extends u64 {
}
export declare type BlockAndTimeType = {
    block: BlockNumber;
    time: Moment;
};
export declare class BlockAndTime extends Struct {
    constructor(value?: BlockAndTimeType);
    readonly block: BlockNumber;
    readonly time: Moment;
}
export declare type ContentVisibilityKey = 'Draft' | 'Public';
export declare class ContentVisibility extends Enum {
    constructor(value?: ContentVisibilityKey);
}
declare const VecContentId_base: import("@polkadot/types/types").Constructor<Vector<ContentId>>;
export declare class VecContentId extends VecContentId_base {
}
export declare type ContentMetadataJsonV1 = {
    name: string;
    description?: string;
    thumbnail?: string;
    keywords?: string;
};
export declare class ContentMetadata extends Struct {
    constructor(value?: any);
    readonly owner: AccountId;
    readonly added_at: BlockAndTime;
    readonly children_ids: VecContentId;
    readonly visibility: ContentVisibility;
    readonly schema: SchemaId;
    readonly json: Text;
    parseJson(): ContentMetadataJsonV1;
}
declare const OptionVecContentId_base: import("@polkadot/types/types").Constructor<Option<import("@polkadot/types/types").Codec>>;
export declare class OptionVecContentId extends OptionVecContentId_base {
}
declare const OptionSchemaId_base: import("@polkadot/types/types").Constructor<Option<import("@polkadot/types/types").Codec>>;
export declare class OptionSchemaId extends OptionSchemaId_base {
}
declare const OptionContentVisibility_base: import("@polkadot/types/types").Constructor<Option<import("@polkadot/types/types").Codec>>;
export declare class OptionContentVisibility extends OptionContentVisibility_base {
}
export declare type ContentMetadataUpdateType = {
    children_ids: OptionVecContentId;
    visibility: OptionContentVisibility;
    schema: OptionSchemaId;
    json: OptionText;
};
export declare class ContentMetadataUpdate extends Struct {
    constructor(value?: ContentMetadataUpdateType);
}
export declare type LiaisonJudgementKey = 'Pending' | 'Accepted' | 'Rejected';
export declare class LiaisonJudgement extends Enum {
    constructor(value?: LiaisonJudgementKey);
}
export declare class DataObject extends Struct {
    constructor(value?: any);
    readonly owner: AccountId;
    readonly added_at: BlockAndTime;
    readonly type_id: DataObjectTypeId;
    /** Actually it's 'size', but 'size' is already reserved by a parent class. */
    readonly size_in_bytes: u64;
    readonly liaison: AccountId;
    readonly liaison_judgement: LiaisonJudgement;
    readonly ipfs_content_id: Text;
}
export declare class DataObjectStorageRelationship extends Struct {
    constructor(value?: any);
    readonly content_id: ContentId;
    readonly storage_provider: AccountId;
    readonly ready: Bool;
}
export declare class DataObjectType extends Struct {
    constructor(value?: any);
    readonly description: Text;
    readonly active: Bool;
}
export declare type DownloadStateKey = 'Started' | 'Ended';
export declare class DownloadState extends Enum {
    constructor(value?: DownloadStateKey);
}
export declare class DownloadSession extends Struct {
    constructor(value?: any);
    readonly content_id: ContentId;
    readonly consumer: AccountId;
    readonly distributor: AccountId;
    readonly initiated_at_block: BlockNumber;
    readonly initiated_at_time: Moment;
    readonly state: DownloadState;
    readonly transmitted_bytes: u64;
}
export declare function registerMediaTypes(): void;
export {};
