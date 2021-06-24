// package: 
// file: proto/Membership.proto

import * as jspb from "google-protobuf";

export class MembershipMetadata extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string | undefined;
  setName(value: string): void;

  hasAvatarUri(): boolean;
  clearAvatarUri(): void;
  getAvatarUri(): string | undefined;
  setAvatarUri(value: string): void;

  hasAbout(): boolean;
  clearAbout(): void;
  getAbout(): string | undefined;
  setAbout(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MembershipMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: MembershipMetadata): MembershipMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MembershipMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MembershipMetadata;
  static deserializeBinaryFromReader(message: MembershipMetadata, reader: jspb.BinaryReader): MembershipMetadata;
}

export namespace MembershipMetadata {
  export type AsObject = {
    name?: string,
    avatarUri?: string,
    about?: string,
  }
}

