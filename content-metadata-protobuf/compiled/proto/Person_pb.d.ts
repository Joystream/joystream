// package: 
// file: proto/Person.proto

import * as jspb from "google-protobuf";

export class PersonMetadata extends jspb.Message {
  hasFirstName(): boolean;
  clearFirstName(): void;
  getFirstName(): string | undefined;
  setFirstName(value: string): void;

  hasMiddleName(): boolean;
  clearMiddleName(): void;
  getMiddleName(): string | undefined;
  setMiddleName(value: string): void;

  hasLastName(): boolean;
  clearLastName(): void;
  getLastName(): string | undefined;
  setLastName(value: string): void;

  hasAbout(): boolean;
  clearAbout(): void;
  getAbout(): string | undefined;
  setAbout(value: string): void;

  hasCoverPhoto(): boolean;
  clearCoverPhoto(): void;
  getCoverPhoto(): number | undefined;
  setCoverPhoto(value: number): void;

  hasAvatarPhoto(): boolean;
  clearAvatarPhoto(): void;
  getAvatarPhoto(): number | undefined;
  setAvatarPhoto(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PersonMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: PersonMetadata): PersonMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PersonMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PersonMetadata;
  static deserializeBinaryFromReader(message: PersonMetadata, reader: jspb.BinaryReader): PersonMetadata;
}

export namespace PersonMetadata {
  export type AsObject = {
    firstName?: string,
    middleName?: string,
    lastName?: string,
    about?: string,
    coverPhoto?: number,
    avatarPhoto?: number,
  }
}

