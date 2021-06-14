// package: 
// file: proto/Council.proto

import * as jspb from "google-protobuf";

export class CouncilCandidacyNoteMetadata extends jspb.Message {
  hasHeader(): boolean;
  clearHeader(): void;
  getHeader(): string | undefined;
  setHeader(value: string): void;

  clearBulletPointsList(): void;
  getBulletPointsList(): Array<string>;
  setBulletPointsList(value: Array<string>): void;
  addBulletPoints(value: string, index?: number): string;

  hasCoverImage(): boolean;
  clearCoverImage(): void;
  getCoverImage(): string | undefined;
  setCoverImage(value: string): void;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CouncilCandidacyNoteMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: CouncilCandidacyNoteMetadata): CouncilCandidacyNoteMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CouncilCandidacyNoteMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CouncilCandidacyNoteMetadata;
  static deserializeBinaryFromReader(message: CouncilCandidacyNoteMetadata, reader: jspb.BinaryReader): CouncilCandidacyNoteMetadata;
}

export namespace CouncilCandidacyNoteMetadata {
  export type AsObject = {
    header?: string,
    bulletPointsList: Array<string>,
    coverImage?: string,
    description?: string,
  }
}

