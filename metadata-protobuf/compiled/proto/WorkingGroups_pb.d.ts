// package: 
// file: proto/WorkingGroups.proto

import * as jspb from "google-protobuf";

export class OpeningMetadata extends jspb.Message {
  hasShortDescription(): boolean;
  clearShortDescription(): void;
  getShortDescription(): string | undefined;
  setShortDescription(value: string): void;

  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): void;

  hasHiringLimit(): boolean;
  clearHiringLimit(): void;
  getHiringLimit(): number | undefined;
  setHiringLimit(value: number): void;

  hasExpectedDuration(): boolean;
  clearExpectedDuration(): void;
  getExpectedDuration(): number | undefined;
  setExpectedDuration(value: number): void;

  hasApplicationDetails(): boolean;
  clearApplicationDetails(): void;
  getApplicationDetails(): string | undefined;
  setApplicationDetails(value: string): void;

  clearApplicationFormQuestionsList(): void;
  getApplicationFormQuestionsList(): Array<OpeningMetadata.ApplicationFormQuestion>;
  setApplicationFormQuestionsList(value: Array<OpeningMetadata.ApplicationFormQuestion>): void;
  addApplicationFormQuestions(value?: OpeningMetadata.ApplicationFormQuestion, index?: number): OpeningMetadata.ApplicationFormQuestion;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OpeningMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: OpeningMetadata): OpeningMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OpeningMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OpeningMetadata;
  static deserializeBinaryFromReader(message: OpeningMetadata, reader: jspb.BinaryReader): OpeningMetadata;
}

export namespace OpeningMetadata {
  export type AsObject = {
    shortDescription?: string,
    description?: string,
    hiringLimit?: number,
    expectedDuration?: number,
    applicationDetails?: string,
    applicationFormQuestionsList: Array<OpeningMetadata.ApplicationFormQuestion.AsObject>,
  }

  export class ApplicationFormQuestion extends jspb.Message {
    hasQuestion(): boolean;
    clearQuestion(): void;
    getQuestion(): string | undefined;
    setQuestion(value: string): void;

    hasType(): boolean;
    clearType(): void;
    getType(): OpeningMetadata.ApplicationFormQuestion.InputTypeMap[keyof OpeningMetadata.ApplicationFormQuestion.InputTypeMap] | undefined;
    setType(value: OpeningMetadata.ApplicationFormQuestion.InputTypeMap[keyof OpeningMetadata.ApplicationFormQuestion.InputTypeMap]): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ApplicationFormQuestion.AsObject;
    static toObject(includeInstance: boolean, msg: ApplicationFormQuestion): ApplicationFormQuestion.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ApplicationFormQuestion, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ApplicationFormQuestion;
    static deserializeBinaryFromReader(message: ApplicationFormQuestion, reader: jspb.BinaryReader): ApplicationFormQuestion;
  }

  export namespace ApplicationFormQuestion {
    export type AsObject = {
      question?: string,
      type?: OpeningMetadata.ApplicationFormQuestion.InputTypeMap[keyof OpeningMetadata.ApplicationFormQuestion.InputTypeMap],
    }

    export interface InputTypeMap {
      TEXT: 1;
      TEXTAREA: 2;
    }

    export const InputType: InputTypeMap;
  }
}

export class ApplicationMetadata extends jspb.Message {
  clearAnswersList(): void;
  getAnswersList(): Array<string>;
  setAnswersList(value: Array<string>): void;
  addAnswers(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ApplicationMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: ApplicationMetadata): ApplicationMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ApplicationMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ApplicationMetadata;
  static deserializeBinaryFromReader(message: ApplicationMetadata, reader: jspb.BinaryReader): ApplicationMetadata;
}

export namespace ApplicationMetadata {
  export type AsObject = {
    answersList: Array<string>,
  }
}

export class WorkingGroupStatusMetadata extends jspb.Message {
  hasDescription(): boolean;
  clearDescription(): void;
  getDescription(): string | undefined;
  setDescription(value: string): void;

  hasAbout(): boolean;
  clearAbout(): void;
  getAbout(): string | undefined;
  setAbout(value: string): void;

  hasStatus(): boolean;
  clearStatus(): void;
  getStatus(): string | undefined;
  setStatus(value: string): void;

  hasStatusMessage(): boolean;
  clearStatusMessage(): void;
  getStatusMessage(): string | undefined;
  setStatusMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WorkingGroupStatusMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: WorkingGroupStatusMetadata): WorkingGroupStatusMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WorkingGroupStatusMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WorkingGroupStatusMetadata;
  static deserializeBinaryFromReader(message: WorkingGroupStatusMetadata, reader: jspb.BinaryReader): WorkingGroupStatusMetadata;
}

export namespace WorkingGroupStatusMetadata {
  export type AsObject = {
    description?: string,
    about?: string,
    status?: string,
    statusMessage?: string,
  }
}

