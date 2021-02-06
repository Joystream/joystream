// package: 
// file: proto/Series.proto

import * as jspb from "google-protobuf";

export class SeriesMetadata extends jspb.Message {
  hasTitle(): boolean;
  clearTitle(): void;
  getTitle(): string | undefined;
  setTitle(value: string): void;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): void;

  hasCoverPhoto(): boolean;
  clearCoverPhoto(): void;
  getCoverPhoto(): number | undefined;
  setCoverPhoto(value: number): void;

  clearPersonsList(): void;
  getPersonsList(): Array<number>;
  setPersonsList(value: Array<number>): void;
  addPersons(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SeriesMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: SeriesMetadata): SeriesMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SeriesMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SeriesMetadata;
  static deserializeBinaryFromReader(message: SeriesMetadata, reader: jspb.BinaryReader): SeriesMetadata;
}

export namespace SeriesMetadata {
  export type AsObject = {
    title?: string,
    description?: string,
    coverPhoto?: number,
    personsList: Array<number>,
  }
}

export class SeasonMetadata extends jspb.Message {
  hasTitle(): boolean;
  clearTitle(): void;
  getTitle(): string | undefined;
  setTitle(value: string): void;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): void;

  hasCoverPhoto(): boolean;
  clearCoverPhoto(): void;
  getCoverPhoto(): number | undefined;
  setCoverPhoto(value: number): void;

  clearPersonsList(): void;
  getPersonsList(): Array<number>;
  setPersonsList(value: Array<number>): void;
  addPersons(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SeasonMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: SeasonMetadata): SeasonMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SeasonMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SeasonMetadata;
  static deserializeBinaryFromReader(message: SeasonMetadata, reader: jspb.BinaryReader): SeasonMetadata;
}

export namespace SeasonMetadata {
  export type AsObject = {
    title?: string,
    description?: string,
    coverPhoto?: number,
    personsList: Array<number>,
  }
}

