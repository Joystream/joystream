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

  hasExpectedEndingTimestamp(): boolean;
  clearExpectedEndingTimestamp(): void;
  getExpectedEndingTimestamp(): number | undefined;
  setExpectedEndingTimestamp(value: number): void;

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
    expectedEndingTimestamp?: number,
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

export class UpcomingOpeningMetadata extends jspb.Message {
  hasExpectedStart(): boolean;
  clearExpectedStart(): void;
  getExpectedStart(): number | undefined;
  setExpectedStart(value: number): void;

  hasRewardPerBlock(): boolean;
  clearRewardPerBlock(): void;
  getRewardPerBlock(): number | undefined;
  setRewardPerBlock(value: number): void;

  hasMinApplicationStake(): boolean;
  clearMinApplicationStake(): void;
  getMinApplicationStake(): number | undefined;
  setMinApplicationStake(value: number): void;

  hasMetadata(): boolean;
  clearMetadata(): void;
  getMetadata(): OpeningMetadata;
  setMetadata(value?: OpeningMetadata): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpcomingOpeningMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: UpcomingOpeningMetadata): UpcomingOpeningMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpcomingOpeningMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpcomingOpeningMetadata;
  static deserializeBinaryFromReader(message: UpcomingOpeningMetadata, reader: jspb.BinaryReader): UpcomingOpeningMetadata;
}

export namespace UpcomingOpeningMetadata {
  export type AsObject = {
    expectedStart?: number,
    rewardPerBlock?: number,
    minApplicationStake?: number,
    metadata: OpeningMetadata.AsObject,
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

export class WorkingGroupMetadata extends jspb.Message {
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
  toObject(includeInstance?: boolean): WorkingGroupMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: WorkingGroupMetadata): WorkingGroupMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WorkingGroupMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WorkingGroupMetadata;
  static deserializeBinaryFromReader(message: WorkingGroupMetadata, reader: jspb.BinaryReader): WorkingGroupMetadata;
}

export namespace WorkingGroupMetadata {
  export type AsObject = {
    description?: string,
    about?: string,
    status?: string,
    statusMessage?: string,
  }
}

export class SetGroupMetadata extends jspb.Message {
  hasNewMetadata(): boolean;
  clearNewMetadata(): void;
  getNewMetadata(): WorkingGroupMetadata;
  setNewMetadata(value?: WorkingGroupMetadata): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetGroupMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: SetGroupMetadata): SetGroupMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetGroupMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetGroupMetadata;
  static deserializeBinaryFromReader(message: SetGroupMetadata, reader: jspb.BinaryReader): SetGroupMetadata;
}

export namespace SetGroupMetadata {
  export type AsObject = {
    newMetadata: WorkingGroupMetadata.AsObject,
  }
}

export class AddUpcomingOpening extends jspb.Message {
  hasMetadata(): boolean;
  clearMetadata(): void;
  getMetadata(): UpcomingOpeningMetadata;
  setMetadata(value?: UpcomingOpeningMetadata): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddUpcomingOpening.AsObject;
  static toObject(includeInstance: boolean, msg: AddUpcomingOpening): AddUpcomingOpening.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AddUpcomingOpening, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddUpcomingOpening;
  static deserializeBinaryFromReader(message: AddUpcomingOpening, reader: jspb.BinaryReader): AddUpcomingOpening;
}

export namespace AddUpcomingOpening {
  export type AsObject = {
    metadata: UpcomingOpeningMetadata.AsObject,
  }
}

export class RemoveUpcomingOpening extends jspb.Message {
  hasId(): boolean;
  clearId(): void;
  getId(): string | undefined;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveUpcomingOpening.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveUpcomingOpening): RemoveUpcomingOpening.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RemoveUpcomingOpening, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveUpcomingOpening;
  static deserializeBinaryFromReader(message: RemoveUpcomingOpening, reader: jspb.BinaryReader): RemoveUpcomingOpening;
}

export namespace RemoveUpcomingOpening {
  export type AsObject = {
    id?: string,
  }
}

export class WorkingGroupMetadataAction extends jspb.Message {
  hasSetGroupMetadata(): boolean;
  clearSetGroupMetadata(): void;
  getSetGroupMetadata(): SetGroupMetadata | undefined;
  setSetGroupMetadata(value?: SetGroupMetadata): void;

  hasAddUpcomingOpening(): boolean;
  clearAddUpcomingOpening(): void;
  getAddUpcomingOpening(): AddUpcomingOpening | undefined;
  setAddUpcomingOpening(value?: AddUpcomingOpening): void;

  hasRemoveUpcomingOpening(): boolean;
  clearRemoveUpcomingOpening(): void;
  getRemoveUpcomingOpening(): RemoveUpcomingOpening | undefined;
  setRemoveUpcomingOpening(value?: RemoveUpcomingOpening): void;

  getActionCase(): WorkingGroupMetadataAction.ActionCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WorkingGroupMetadataAction.AsObject;
  static toObject(includeInstance: boolean, msg: WorkingGroupMetadataAction): WorkingGroupMetadataAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WorkingGroupMetadataAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WorkingGroupMetadataAction;
  static deserializeBinaryFromReader(message: WorkingGroupMetadataAction, reader: jspb.BinaryReader): WorkingGroupMetadataAction;
}

export namespace WorkingGroupMetadataAction {
  export type AsObject = {
    setGroupMetadata?: SetGroupMetadata.AsObject,
    addUpcomingOpening?: AddUpcomingOpening.AsObject,
    removeUpcomingOpening?: RemoveUpcomingOpening.AsObject,
  }

  export enum ActionCase {
    ACTION_NOT_SET = 0,
    SET_GROUP_METADATA = 1,
    ADD_UPCOMING_OPENING = 2,
    REMOVE_UPCOMING_OPENING = 3,
  }
}

