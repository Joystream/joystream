// package: 
// file: proto/Video.proto

import * as jspb from "google-protobuf";

export class PublishedBeforeJoystream extends jspb.Message {
  hasIsPublished(): boolean;
  clearIsPublished(): void;
  getIsPublished(): boolean | undefined;
  setIsPublished(value: boolean): void;

  hasDate(): boolean;
  clearDate(): void;
  getDate(): string | undefined;
  setDate(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PublishedBeforeJoystream.AsObject;
  static toObject(includeInstance: boolean, msg: PublishedBeforeJoystream): PublishedBeforeJoystream.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PublishedBeforeJoystream, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PublishedBeforeJoystream;
  static deserializeBinaryFromReader(message: PublishedBeforeJoystream, reader: jspb.BinaryReader): PublishedBeforeJoystream;
}

export namespace PublishedBeforeJoystream {
  export type AsObject = {
    isPublished?: boolean,
    date?: string,
  }
}

export class License extends jspb.Message {
  hasCode(): boolean;
  clearCode(): void;
  getCode(): number | undefined;
  setCode(value: number): void;

  hasAttribution(): boolean;
  clearAttribution(): void;
  getAttribution(): string | undefined;
  setAttribution(value: string): void;

  hasCustomText(): boolean;
  clearCustomText(): void;
  getCustomText(): string | undefined;
  setCustomText(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): License.AsObject;
  static toObject(includeInstance: boolean, msg: License): License.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: License, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): License;
  static deserializeBinaryFromReader(message: License, reader: jspb.BinaryReader): License;
}

export namespace License {
  export type AsObject = {
    code?: number,
    attribution?: string,
    customText?: string,
  }
}

export class MediaType extends jspb.Message {
  hasCodecName(): boolean;
  clearCodecName(): void;
  getCodecName(): string | undefined;
  setCodecName(value: string): void;

  hasContainer(): boolean;
  clearContainer(): void;
  getContainer(): string | undefined;
  setContainer(value: string): void;

  hasMimeMediaType(): boolean;
  clearMimeMediaType(): void;
  getMimeMediaType(): string | undefined;
  setMimeMediaType(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MediaType.AsObject;
  static toObject(includeInstance: boolean, msg: MediaType): MediaType.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MediaType, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MediaType;
  static deserializeBinaryFromReader(message: MediaType, reader: jspb.BinaryReader): MediaType;
}

export namespace MediaType {
  export type AsObject = {
    codecName?: string,
    container?: string,
    mimeMediaType?: string,
  }
}

export class VideoMetadata extends jspb.Message {
  hasTitle(): boolean;
  clearTitle(): void;
  getTitle(): string | undefined;
  setTitle(value: string): void;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): void;

  hasVideo(): boolean;
  clearVideo(): void;
  getVideo(): number | undefined;
  setVideo(value: number): void;

  hasThumbnailPhoto(): boolean;
  clearThumbnailPhoto(): void;
  getThumbnailPhoto(): number | undefined;
  setThumbnailPhoto(value: number): void;

  hasDuration(): boolean;
  clearDuration(): void;
  getDuration(): number | undefined;
  setDuration(value: number): void;

  hasMediaPixelHeight(): boolean;
  clearMediaPixelHeight(): void;
  getMediaPixelHeight(): number | undefined;
  setMediaPixelHeight(value: number): void;

  hasMediaPixelWidth(): boolean;
  clearMediaPixelWidth(): void;
  getMediaPixelWidth(): number | undefined;
  setMediaPixelWidth(value: number): void;

  hasMediaType(): boolean;
  clearMediaType(): void;
  getMediaType(): MediaType | undefined;
  setMediaType(value?: MediaType): void;

  hasLanguage(): boolean;
  clearLanguage(): void;
  getLanguage(): string | undefined;
  setLanguage(value: string): void;

  hasLicense(): boolean;
  clearLicense(): void;
  getLicense(): License | undefined;
  setLicense(value?: License): void;

  hasPublishedBeforeJoystream(): boolean;
  clearPublishedBeforeJoystream(): void;
  getPublishedBeforeJoystream(): PublishedBeforeJoystream | undefined;
  setPublishedBeforeJoystream(value?: PublishedBeforeJoystream): void;

  hasHasMarketing(): boolean;
  clearHasMarketing(): void;
  getHasMarketing(): boolean | undefined;
  setHasMarketing(value: boolean): void;

  hasIsPublic(): boolean;
  clearIsPublic(): void;
  getIsPublic(): boolean | undefined;
  setIsPublic(value: boolean): void;

  hasIsExplicit(): boolean;
  clearIsExplicit(): void;
  getIsExplicit(): boolean | undefined;
  setIsExplicit(value: boolean): void;

  clearPersonsList(): void;
  getPersonsList(): Array<number>;
  setPersonsList(value: Array<number>): void;
  addPersons(value: number, index?: number): number;

  hasCategory(): boolean;
  clearCategory(): void;
  getCategory(): number | undefined;
  setCategory(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VideoMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: VideoMetadata): VideoMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VideoMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VideoMetadata;
  static deserializeBinaryFromReader(message: VideoMetadata, reader: jspb.BinaryReader): VideoMetadata;
}

export namespace VideoMetadata {
  export type AsObject = {
    title?: string,
    description?: string,
    video?: number,
    thumbnailPhoto?: number,
    duration?: number,
    mediaPixelHeight?: number,
    mediaPixelWidth?: number,
    mediaType?: MediaType.AsObject,
    language?: string,
    license?: License.AsObject,
    publishedBeforeJoystream?: PublishedBeforeJoystream.AsObject,
    hasMarketing?: boolean,
    isPublic?: boolean,
    isExplicit?: boolean,
    personsList: Array<number>,
    category?: number,
  }
}

export class VideoCategoryMetadata extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string | undefined;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VideoCategoryMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: VideoCategoryMetadata): VideoCategoryMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VideoCategoryMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VideoCategoryMetadata;
  static deserializeBinaryFromReader(message: VideoCategoryMetadata, reader: jspb.BinaryReader): VideoCategoryMetadata;
}

export namespace VideoCategoryMetadata {
  export type AsObject = {
    name?: string,
  }
}

