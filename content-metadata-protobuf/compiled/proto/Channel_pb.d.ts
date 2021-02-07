// package: 
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

