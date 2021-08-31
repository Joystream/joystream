// package: 
// file: proto/Playlist.proto

import * as jspb from "google-protobuf";

export class PlaylistMetadata extends jspb.Message {
  hasTitle(): boolean;
  clearTitle(): void;
  getTitle(): string | undefined;
  setTitle(value: string): void;

  clearVideosList(): void;
  getVideosList(): Array<number>;
  setVideosList(value: Array<number>): void;
  addVideos(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlaylistMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: PlaylistMetadata): PlaylistMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PlaylistMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlaylistMetadata;
  static deserializeBinaryFromReader(message: PlaylistMetadata, reader: jspb.BinaryReader): PlaylistMetadata;
}

export namespace PlaylistMetadata {
  export type AsObject = {
    title?: string,
    videosList: Array<number>,
  }
}

