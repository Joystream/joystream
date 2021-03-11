// package: muthu.other
// file: proto/Channel.proto

import * as jspb from "google-protobuf";

export class ChannelMetadata extends jspb.Message {
  hasTitle(): boolean;
  clearTitle(): void;
  getTitle(): string | undefined;
  setTitle(value: string): void;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): void;

  hasIsPublic(): boolean;
  clearIsPublic(): void;
  getIsPublic(): boolean | undefined;
  setIsPublic(value: boolean): void;

  hasLanguage(): boolean;
  clearLanguage(): void;
  getLanguage(): string | undefined;
  setLanguage(value: string): void;

  hasCoverPhoto(): boolean;
  clearCoverPhoto(): void;
  getCoverPhoto(): number | undefined;
  setCoverPhoto(value: number): void;

  hasAvatarPhoto(): boolean;
  clearAvatarPhoto(): void;
  getAvatarPhoto(): number | undefined;
  setAvatarPhoto(value: number): void;

  hasCategory(): boolean;
  clearCategory(): void;
  getCategory(): number | undefined;
  setCategory(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelMetadata): ChannelMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelMetadata;
  static deserializeBinaryFromReader(message: ChannelMetadata, reader: jspb.BinaryReader): ChannelMetadata;
}

export namespace ChannelMetadata {
  export type AsObject = {
    title?: string,
    description?: string,
    isPublic?: boolean,
    language?: string,
    coverPhoto?: number,
    avatarPhoto?: number,
    category?: number,
  }
}

export class ChannelCategoryMetadata extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string | undefined;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelCategoryMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelCategoryMetadata): ChannelCategoryMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelCategoryMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelCategoryMetadata;
  static deserializeBinaryFromReader(message: ChannelCategoryMetadata, reader: jspb.BinaryReader): ChannelCategoryMetadata;
}

export namespace ChannelCategoryMetadata {
  export type AsObject = {
    name?: string,
  }
}

export class Upload extends jspb.Message {
  hasContentId(): boolean;
  clearContentId(): void;
  getContentId(): number | undefined;
  setContentId(value: number): void;

  hasTypeId(): boolean;
  clearTypeId(): void;
  getTypeId(): number | undefined;
  setTypeId(value: number): void;

  hasSize(): boolean;
  clearSize(): void;
  getSize(): number | undefined;
  setSize(value: number): void;

  hasIpfsContentId(): boolean;
  clearIpfsContentId(): void;
  getIpfsContentId(): Uint8Array | string;
  getIpfsContentId_asU8(): Uint8Array;
  getIpfsContentId_asB64(): string;
  setIpfsContentId(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Upload.AsObject;
  static toObject(includeInstance: boolean, msg: Upload): Upload.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Upload, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Upload;
  static deserializeBinaryFromReader(message: Upload, reader: jspb.BinaryReader): Upload;
}

export namespace Upload {
  export type AsObject = {
    contentId?: number,
    typeId?: number,
    size?: number,
    ipfsContentId: Uint8Array | string,
  }
}

export class Urls extends jspb.Message {
  clearUrlsList(): void;
  getUrlsList(): Array<Uint8Array | string>;
  getUrlsList_asU8(): Array<Uint8Array>;
  getUrlsList_asB64(): Array<string>;
  setUrlsList(value: Array<Uint8Array | string>): void;
  addUrls(value: Uint8Array | string, index?: number): Uint8Array | string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Urls.AsObject;
  static toObject(includeInstance: boolean, msg: Urls): Urls.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Urls, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Urls;
  static deserializeBinaryFromReader(message: Urls, reader: jspb.BinaryReader): Urls;
}

export namespace Urls {
  export type AsObject = {
    urlsList: Array<Uint8Array | string>,
  }
}

export class NewAssetMetadata extends jspb.Message {
  hasUpload(): boolean;
  clearUpload(): void;
  getUpload(): Upload | undefined;
  setUpload(value?: Upload): void;

  hasUrls(): boolean;
  clearUrls(): void;
  getUrls(): Urls | undefined;
  setUrls(value?: Urls): void;

  getNewAssetCase(): NewAssetMetadata.NewAssetCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NewAssetMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: NewAssetMetadata): NewAssetMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NewAssetMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NewAssetMetadata;
  static deserializeBinaryFromReader(message: NewAssetMetadata, reader: jspb.BinaryReader): NewAssetMetadata;
}

export namespace NewAssetMetadata {
  export type AsObject = {
    upload?: Upload.AsObject,
    urls?: Urls.AsObject,
  }

  export enum NewAssetCase {
    NEW_ASSET_NOT_SET = 0,
    UPLOAD = 1,
    URLS = 2,
  }
}

export class AssetsMetadata extends jspb.Message {
  clearNewAssetList(): void;
  getNewAssetList(): Array<NewAssetMetadata>;
  setNewAssetList(value: Array<NewAssetMetadata>): void;
  addNewAsset(value?: NewAssetMetadata, index?: number): NewAssetMetadata;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AssetsMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: AssetsMetadata): AssetsMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AssetsMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AssetsMetadata;
  static deserializeBinaryFromReader(message: AssetsMetadata, reader: jspb.BinaryReader): AssetsMetadata;
}

export namespace AssetsMetadata {
  export type AsObject = {
    newAssetList: Array<NewAssetMetadata.AsObject>,
  }
}

export class ChannelCreationParametersMetadata extends jspb.Message {
  hasAssets(): boolean;
  clearAssets(): void;
  getAssets(): AssetsMetadata | undefined;
  setAssets(value?: AssetsMetadata): void;

  hasMeta(): boolean;
  clearMeta(): void;
  getMeta(): ChannelMetadata | undefined;
  setMeta(value?: ChannelMetadata): void;

  hasRewardAccount(): boolean;
  clearRewardAccount(): void;
  getRewardAccount(): Uint8Array | string;
  getRewardAccount_asU8(): Uint8Array;
  getRewardAccount_asB64(): string;
  setRewardAccount(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChannelCreationParametersMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: ChannelCreationParametersMetadata): ChannelCreationParametersMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChannelCreationParametersMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChannelCreationParametersMetadata;
  static deserializeBinaryFromReader(message: ChannelCreationParametersMetadata, reader: jspb.BinaryReader): ChannelCreationParametersMetadata;
}

export namespace ChannelCreationParametersMetadata {
  export type AsObject = {
    assets?: AssetsMetadata.AsObject,
    meta?: ChannelMetadata.AsObject,
    rewardAccount: Uint8Array | string,
  }
}

