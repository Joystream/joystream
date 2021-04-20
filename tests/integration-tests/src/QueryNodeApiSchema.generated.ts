export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any
  /** GraphQL representation of BigInt */
  BigInt: any
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any
}

export type ApplicationFormQuestion = BaseGraphQlObject & {
  __typename?: 'ApplicationFormQuestion'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  openingMetadata: WorkingGroupOpeningMetadata
  openingMetadataId: Scalars['String']
  /** The question itself */
  question: Scalars['String']
  /** Type of the question (UI answer input type) */
  type: ApplicationFormQuestionType
  /** Index of the question */
  index: Scalars['Int']
  applicationformquestionanswerquestion?: Maybe<Array<ApplicationFormQuestionAnswer>>
}

export type ApplicationFormQuestionAnswer = BaseGraphQlObject & {
  __typename?: 'ApplicationFormQuestionAnswer'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  application: WorkingGroupApplication
  applicationId: Scalars['String']
  question: ApplicationFormQuestion
  questionId: Scalars['String']
  /** Applicant's answer */
  answer: Scalars['String']
}

export type ApplicationFormQuestionAnswerConnection = {
  __typename?: 'ApplicationFormQuestionAnswerConnection'
  totalCount: Scalars['Int']
  edges: Array<ApplicationFormQuestionAnswerEdge>
  pageInfo: PageInfo
}

export type ApplicationFormQuestionAnswerCreateInput = {
  applicationId: Scalars['ID']
  questionId: Scalars['ID']
  answer: Scalars['String']
}

export type ApplicationFormQuestionAnswerEdge = {
  __typename?: 'ApplicationFormQuestionAnswerEdge'
  node: ApplicationFormQuestionAnswer
  cursor: Scalars['String']
}

export enum ApplicationFormQuestionAnswerOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  ApplicationIdAsc = 'applicationId_ASC',
  ApplicationIdDesc = 'applicationId_DESC',
  QuestionIdAsc = 'questionId_ASC',
  QuestionIdDesc = 'questionId_DESC',
  AnswerAsc = 'answer_ASC',
  AnswerDesc = 'answer_DESC',
}

export type ApplicationFormQuestionAnswerUpdateInput = {
  applicationId?: Maybe<Scalars['ID']>
  questionId?: Maybe<Scalars['ID']>
  answer?: Maybe<Scalars['String']>
}

export type ApplicationFormQuestionAnswerWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  applicationId_eq?: Maybe<Scalars['ID']>
  applicationId_in?: Maybe<Array<Scalars['ID']>>
  questionId_eq?: Maybe<Scalars['ID']>
  questionId_in?: Maybe<Array<Scalars['ID']>>
  answer_eq?: Maybe<Scalars['String']>
  answer_contains?: Maybe<Scalars['String']>
  answer_startsWith?: Maybe<Scalars['String']>
  answer_endsWith?: Maybe<Scalars['String']>
  answer_in?: Maybe<Array<Scalars['String']>>
}

export type ApplicationFormQuestionAnswerWhereUniqueInput = {
  id: Scalars['ID']
}

export type ApplicationFormQuestionConnection = {
  __typename?: 'ApplicationFormQuestionConnection'
  totalCount: Scalars['Int']
  edges: Array<ApplicationFormQuestionEdge>
  pageInfo: PageInfo
}

export type ApplicationFormQuestionCreateInput = {
  openingMetadataId: Scalars['ID']
  question: Scalars['String']
  type: ApplicationFormQuestionType
  index: Scalars['Float']
}

export type ApplicationFormQuestionEdge = {
  __typename?: 'ApplicationFormQuestionEdge'
  node: ApplicationFormQuestion
  cursor: Scalars['String']
}

export enum ApplicationFormQuestionOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  OpeningMetadataIdAsc = 'openingMetadataId_ASC',
  OpeningMetadataIdDesc = 'openingMetadataId_DESC',
  QuestionAsc = 'question_ASC',
  QuestionDesc = 'question_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  IndexAsc = 'index_ASC',
  IndexDesc = 'index_DESC',
}

export enum ApplicationFormQuestionType {
  Text = 'TEXT',
  Textarea = 'TEXTAREA',
}

export type ApplicationFormQuestionUpdateInput = {
  openingMetadataId?: Maybe<Scalars['ID']>
  question?: Maybe<Scalars['String']>
  type?: Maybe<ApplicationFormQuestionType>
  index?: Maybe<Scalars['Float']>
}

export type ApplicationFormQuestionWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  openingMetadataId_eq?: Maybe<Scalars['ID']>
  openingMetadataId_in?: Maybe<Array<Scalars['ID']>>
  question_eq?: Maybe<Scalars['String']>
  question_contains?: Maybe<Scalars['String']>
  question_startsWith?: Maybe<Scalars['String']>
  question_endsWith?: Maybe<Scalars['String']>
  question_in?: Maybe<Array<Scalars['String']>>
  type_eq?: Maybe<ApplicationFormQuestionType>
  type_in?: Maybe<Array<ApplicationFormQuestionType>>
  index_eq?: Maybe<Scalars['Int']>
  index_gt?: Maybe<Scalars['Int']>
  index_gte?: Maybe<Scalars['Int']>
  index_lt?: Maybe<Scalars['Int']>
  index_lte?: Maybe<Scalars['Int']>
  index_in?: Maybe<Array<Scalars['Int']>>
}

export type ApplicationFormQuestionWhereUniqueInput = {
  id: Scalars['ID']
}

export type ApplicationStatusAccepted = {
  __typename?: 'ApplicationStatusAccepted'
  openingFilledEventId: Scalars['String']
}

export type ApplicationStatusAcceptedCreateInput = {
  openingFilledEventId: Scalars['String']
}

export type ApplicationStatusAcceptedUpdateInput = {
  openingFilledEventId?: Maybe<Scalars['String']>
}

export type ApplicationStatusAcceptedWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  openingFilledEventId_eq?: Maybe<Scalars['String']>
  openingFilledEventId_contains?: Maybe<Scalars['String']>
  openingFilledEventId_startsWith?: Maybe<Scalars['String']>
  openingFilledEventId_endsWith?: Maybe<Scalars['String']>
  openingFilledEventId_in?: Maybe<Array<Scalars['String']>>
}

export type ApplicationStatusAcceptedWhereUniqueInput = {
  id: Scalars['ID']
}

export type ApplicationStatusCancelled = {
  __typename?: 'ApplicationStatusCancelled'
  openingCancelledEventId: Scalars['String']
}

export type ApplicationStatusCancelledCreateInput = {
  openingCancelledEventId: Scalars['String']
}

export type ApplicationStatusCancelledUpdateInput = {
  openingCancelledEventId?: Maybe<Scalars['String']>
}

export type ApplicationStatusCancelledWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  openingCancelledEventId_eq?: Maybe<Scalars['String']>
  openingCancelledEventId_contains?: Maybe<Scalars['String']>
  openingCancelledEventId_startsWith?: Maybe<Scalars['String']>
  openingCancelledEventId_endsWith?: Maybe<Scalars['String']>
  openingCancelledEventId_in?: Maybe<Array<Scalars['String']>>
}

export type ApplicationStatusCancelledWhereUniqueInput = {
  id: Scalars['ID']
}

export type ApplicationStatusPending = {
  __typename?: 'ApplicationStatusPending'
  phantom?: Maybe<Scalars['Int']>
}

export type ApplicationStatusPendingCreateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type ApplicationStatusPendingUpdateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type ApplicationStatusPendingWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  phantom_eq?: Maybe<Scalars['Int']>
  phantom_gt?: Maybe<Scalars['Int']>
  phantom_gte?: Maybe<Scalars['Int']>
  phantom_lt?: Maybe<Scalars['Int']>
  phantom_lte?: Maybe<Scalars['Int']>
  phantom_in?: Maybe<Array<Scalars['Int']>>
}

export type ApplicationStatusPendingWhereUniqueInput = {
  id: Scalars['ID']
}

export type ApplicationStatusRejected = {
  __typename?: 'ApplicationStatusRejected'
  openingFilledEventId: Scalars['String']
}

export type ApplicationStatusRejectedCreateInput = {
  openingFilledEventId: Scalars['String']
}

export type ApplicationStatusRejectedUpdateInput = {
  openingFilledEventId?: Maybe<Scalars['String']>
}

export type ApplicationStatusRejectedWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  openingFilledEventId_eq?: Maybe<Scalars['String']>
  openingFilledEventId_contains?: Maybe<Scalars['String']>
  openingFilledEventId_startsWith?: Maybe<Scalars['String']>
  openingFilledEventId_endsWith?: Maybe<Scalars['String']>
  openingFilledEventId_in?: Maybe<Array<Scalars['String']>>
}

export type ApplicationStatusRejectedWhereUniqueInput = {
  id: Scalars['ID']
}

export type ApplicationStatusWithdrawn = {
  __typename?: 'ApplicationStatusWithdrawn'
  applicationWithdrawnEventId: Scalars['String']
}

export type ApplicationStatusWithdrawnCreateInput = {
  applicationWithdrawnEventId: Scalars['String']
}

export type ApplicationStatusWithdrawnUpdateInput = {
  applicationWithdrawnEventId?: Maybe<Scalars['String']>
}

export type ApplicationStatusWithdrawnWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  applicationWithdrawnEventId_eq?: Maybe<Scalars['String']>
  applicationWithdrawnEventId_contains?: Maybe<Scalars['String']>
  applicationWithdrawnEventId_startsWith?: Maybe<Scalars['String']>
  applicationWithdrawnEventId_endsWith?: Maybe<Scalars['String']>
  applicationWithdrawnEventId_in?: Maybe<Array<Scalars['String']>>
}

export type ApplicationStatusWithdrawnWhereUniqueInput = {
  id: Scalars['ID']
}

export type ApplicationWithdrawnEvent = BaseGraphQlObject & {
  __typename?: 'ApplicationWithdrawnEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  application: WorkingGroupApplication
  applicationId: Scalars['String']
}

export type ApplicationWithdrawnEventConnection = {
  __typename?: 'ApplicationWithdrawnEventConnection'
  totalCount: Scalars['Int']
  edges: Array<ApplicationWithdrawnEventEdge>
  pageInfo: PageInfo
}

export type ApplicationWithdrawnEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  applicationId: Scalars['ID']
}

export type ApplicationWithdrawnEventEdge = {
  __typename?: 'ApplicationWithdrawnEventEdge'
  node: ApplicationWithdrawnEvent
  cursor: Scalars['String']
}

export enum ApplicationWithdrawnEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  ApplicationIdAsc = 'applicationId_ASC',
  ApplicationIdDesc = 'applicationId_DESC',
}

export type ApplicationWithdrawnEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  applicationId?: Maybe<Scalars['ID']>
}

export type ApplicationWithdrawnEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  applicationId_eq?: Maybe<Scalars['ID']>
  applicationId_in?: Maybe<Array<Scalars['ID']>>
}

export type ApplicationWithdrawnEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type AppliedOnOpeningEvent = BaseGraphQlObject & {
  __typename?: 'AppliedOnOpeningEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  opening: WorkingGroupOpening
  openingId: Scalars['String']
  application: WorkingGroupApplication
  applicationId: Scalars['String']
}

export type AppliedOnOpeningEventConnection = {
  __typename?: 'AppliedOnOpeningEventConnection'
  totalCount: Scalars['Int']
  edges: Array<AppliedOnOpeningEventEdge>
  pageInfo: PageInfo
}

export type AppliedOnOpeningEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  openingId: Scalars['ID']
  applicationId: Scalars['ID']
}

export type AppliedOnOpeningEventEdge = {
  __typename?: 'AppliedOnOpeningEventEdge'
  node: AppliedOnOpeningEvent
  cursor: Scalars['String']
}

export enum AppliedOnOpeningEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  OpeningIdAsc = 'openingId_ASC',
  OpeningIdDesc = 'openingId_DESC',
  ApplicationIdAsc = 'applicationId_ASC',
  ApplicationIdDesc = 'applicationId_DESC',
}

export type AppliedOnOpeningEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  openingId?: Maybe<Scalars['ID']>
  applicationId?: Maybe<Scalars['ID']>
}

export type AppliedOnOpeningEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  openingId_eq?: Maybe<Scalars['ID']>
  openingId_in?: Maybe<Array<Scalars['ID']>>
  applicationId_eq?: Maybe<Scalars['ID']>
  applicationId_in?: Maybe<Array<Scalars['ID']>>
}

export type AppliedOnOpeningEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type BaseGraphQlObject = {
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseModel = BaseGraphQlObject & {
  __typename?: 'BaseModel'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseModelUuid = BaseGraphQlObject & {
  __typename?: 'BaseModelUUID'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
}

export type BaseWhereInput = {
  id_eq?: Maybe<Scalars['String']>
  id_in?: Maybe<Array<Scalars['String']>>
  createdAt_eq?: Maybe<Scalars['String']>
  createdAt_lt?: Maybe<Scalars['String']>
  createdAt_lte?: Maybe<Scalars['String']>
  createdAt_gt?: Maybe<Scalars['String']>
  createdAt_gte?: Maybe<Scalars['String']>
  createdById_eq?: Maybe<Scalars['String']>
  updatedAt_eq?: Maybe<Scalars['String']>
  updatedAt_lt?: Maybe<Scalars['String']>
  updatedAt_lte?: Maybe<Scalars['String']>
  updatedAt_gt?: Maybe<Scalars['String']>
  updatedAt_gte?: Maybe<Scalars['String']>
  updatedById_eq?: Maybe<Scalars['String']>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['String']>
  deletedAt_lt?: Maybe<Scalars['String']>
  deletedAt_lte?: Maybe<Scalars['String']>
  deletedAt_gt?: Maybe<Scalars['String']>
  deletedAt_gte?: Maybe<Scalars['String']>
  deletedById_eq?: Maybe<Scalars['String']>
}

export type BudgetSetEvent = BaseGraphQlObject & {
  __typename?: 'BudgetSetEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  /** New working group budget */
  newBudget: Scalars['BigInt']
}

export type BudgetSetEventConnection = {
  __typename?: 'BudgetSetEventConnection'
  totalCount: Scalars['Int']
  edges: Array<BudgetSetEventEdge>
  pageInfo: PageInfo
}

export type BudgetSetEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  newBudget: Scalars['BigInt']
}

export type BudgetSetEventEdge = {
  __typename?: 'BudgetSetEventEdge'
  node: BudgetSetEvent
  cursor: Scalars['String']
}

export enum BudgetSetEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  NewBudgetAsc = 'newBudget_ASC',
  NewBudgetDesc = 'newBudget_DESC',
}

export type BudgetSetEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  newBudget?: Maybe<Scalars['BigInt']>
}

export type BudgetSetEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  newBudget_eq?: Maybe<Scalars['BigInt']>
  newBudget_gt?: Maybe<Scalars['BigInt']>
  newBudget_gte?: Maybe<Scalars['BigInt']>
  newBudget_lt?: Maybe<Scalars['BigInt']>
  newBudget_lte?: Maybe<Scalars['BigInt']>
  newBudget_in?: Maybe<Array<Scalars['BigInt']>>
}

export type BudgetSetEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type BudgetSpendingEvent = BaseGraphQlObject & {
  __typename?: 'BudgetSpendingEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  /** Reciever account address */
  reciever: Scalars['String']
  /** Amount beeing spent */
  amount: Scalars['BigInt']
  /** Optional rationale */
  rationale?: Maybe<Scalars['String']>
}

export type BudgetSpendingEventConnection = {
  __typename?: 'BudgetSpendingEventConnection'
  totalCount: Scalars['Int']
  edges: Array<BudgetSpendingEventEdge>
  pageInfo: PageInfo
}

export type BudgetSpendingEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  reciever: Scalars['String']
  amount: Scalars['BigInt']
  rationale?: Maybe<Scalars['String']>
}

export type BudgetSpendingEventEdge = {
  __typename?: 'BudgetSpendingEventEdge'
  node: BudgetSpendingEvent
  cursor: Scalars['String']
}

export enum BudgetSpendingEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  RecieverAsc = 'reciever_ASC',
  RecieverDesc = 'reciever_DESC',
  AmountAsc = 'amount_ASC',
  AmountDesc = 'amount_DESC',
  RationaleAsc = 'rationale_ASC',
  RationaleDesc = 'rationale_DESC',
}

export type BudgetSpendingEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  reciever?: Maybe<Scalars['String']>
  amount?: Maybe<Scalars['BigInt']>
  rationale?: Maybe<Scalars['String']>
}

export type BudgetSpendingEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  reciever_eq?: Maybe<Scalars['String']>
  reciever_contains?: Maybe<Scalars['String']>
  reciever_startsWith?: Maybe<Scalars['String']>
  reciever_endsWith?: Maybe<Scalars['String']>
  reciever_in?: Maybe<Array<Scalars['String']>>
  amount_eq?: Maybe<Scalars['BigInt']>
  amount_gt?: Maybe<Scalars['BigInt']>
  amount_gte?: Maybe<Scalars['BigInt']>
  amount_lt?: Maybe<Scalars['BigInt']>
  amount_lte?: Maybe<Scalars['BigInt']>
  amount_in?: Maybe<Array<Scalars['BigInt']>>
  rationale_eq?: Maybe<Scalars['String']>
  rationale_contains?: Maybe<Scalars['String']>
  rationale_startsWith?: Maybe<Scalars['String']>
  rationale_endsWith?: Maybe<Scalars['String']>
  rationale_in?: Maybe<Array<Scalars['String']>>
}

export type BudgetSpendingEventWhereUniqueInput = {
  id: Scalars['ID']
}

/** Manages content ids, type and storage provider decision about it */
export type DataObject = BaseGraphQlObject & {
  __typename?: 'DataObject'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Content owner */
  owner: DataObjectOwner
  /** Content added at */
  addedAt: Scalars['Int']
  /** Content type id */
  typeId: Scalars['Int']
  /** Content size in bytes */
  size: Scalars['BigInt']
  /** Storage provider id of the liaison */
  liaisonId: Scalars['BigInt']
  /** Storage provider as liaison judgment */
  liaisonJudgement: LiaisonJudgement
  /** IPFS content id */
  ipfsContentId: Scalars['String']
  /** Joystream runtime content */
  joystreamContentId: Scalars['String']
  membermetadataavatar?: Maybe<Array<MemberMetadata>>
}

export type DataObjectConnection = {
  __typename?: 'DataObjectConnection'
  totalCount: Scalars['Int']
  edges: Array<DataObjectEdge>
  pageInfo: PageInfo
}

export type DataObjectCreateInput = {
  owner: Scalars['JSONObject']
  addedAt: Scalars['Float']
  typeId: Scalars['Float']
  size: Scalars['BigInt']
  liaisonId: Scalars['BigInt']
  liaisonJudgement: LiaisonJudgement
  ipfsContentId: Scalars['String']
  joystreamContentId: Scalars['String']
}

export type DataObjectEdge = {
  __typename?: 'DataObjectEdge'
  node: DataObject
  cursor: Scalars['String']
}

export enum DataObjectOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  AddedAtAsc = 'addedAt_ASC',
  AddedAtDesc = 'addedAt_DESC',
  TypeIdAsc = 'typeId_ASC',
  TypeIdDesc = 'typeId_DESC',
  SizeAsc = 'size_ASC',
  SizeDesc = 'size_DESC',
  LiaisonIdAsc = 'liaisonId_ASC',
  LiaisonIdDesc = 'liaisonId_DESC',
  LiaisonJudgementAsc = 'liaisonJudgement_ASC',
  LiaisonJudgementDesc = 'liaisonJudgement_DESC',
  IpfsContentIdAsc = 'ipfsContentId_ASC',
  IpfsContentIdDesc = 'ipfsContentId_DESC',
  JoystreamContentIdAsc = 'joystreamContentId_ASC',
  JoystreamContentIdDesc = 'joystreamContentId_DESC',
}

export type DataObjectOwner =
  | DataObjectOwnerMember
  | DataObjectOwnerChannel
  | DataObjectOwnerDao
  | DataObjectOwnerCouncil
  | DataObjectOwnerWorkingGroup

export type DataObjectOwnerChannel = {
  __typename?: 'DataObjectOwnerChannel'
  /** Channel identifier */
  channel: Scalars['BigInt']
  /** Variant needs to have at least one property. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type DataObjectOwnerChannelCreateInput = {
  channel: Scalars['BigInt']
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerChannelUpdateInput = {
  channel?: Maybe<Scalars['BigInt']>
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerChannelWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  channel_eq?: Maybe<Scalars['BigInt']>
  channel_gt?: Maybe<Scalars['BigInt']>
  channel_gte?: Maybe<Scalars['BigInt']>
  channel_lt?: Maybe<Scalars['BigInt']>
  channel_lte?: Maybe<Scalars['BigInt']>
  channel_in?: Maybe<Array<Scalars['BigInt']>>
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
}

export type DataObjectOwnerChannelWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerCouncil = {
  __typename?: 'DataObjectOwnerCouncil'
  /** Variant needs to have at least one property. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type DataObjectOwnerCouncilCreateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerCouncilUpdateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerCouncilWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
}

export type DataObjectOwnerCouncilWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerDao = {
  __typename?: 'DataObjectOwnerDao'
  /** DAO identifier */
  dao: Scalars['BigInt']
}

export type DataObjectOwnerDaoCreateInput = {
  dao: Scalars['BigInt']
}

export type DataObjectOwnerDaoUpdateInput = {
  dao?: Maybe<Scalars['BigInt']>
}

export type DataObjectOwnerDaoWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  dao_eq?: Maybe<Scalars['BigInt']>
  dao_gt?: Maybe<Scalars['BigInt']>
  dao_gte?: Maybe<Scalars['BigInt']>
  dao_lt?: Maybe<Scalars['BigInt']>
  dao_lte?: Maybe<Scalars['BigInt']>
  dao_in?: Maybe<Array<Scalars['BigInt']>>
}

export type DataObjectOwnerDaoWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerMember = {
  __typename?: 'DataObjectOwnerMember'
  /** Member identifier */
  member: Scalars['BigInt']
  /** Variant needs to have at least one property. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type DataObjectOwnerMemberCreateInput = {
  member: Scalars['BigInt']
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerMemberUpdateInput = {
  member?: Maybe<Scalars['BigInt']>
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerMemberWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  member_eq?: Maybe<Scalars['BigInt']>
  member_gt?: Maybe<Scalars['BigInt']>
  member_gte?: Maybe<Scalars['BigInt']>
  member_lt?: Maybe<Scalars['BigInt']>
  member_lte?: Maybe<Scalars['BigInt']>
  member_in?: Maybe<Array<Scalars['BigInt']>>
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
}

export type DataObjectOwnerMemberWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectOwnerWorkingGroup = {
  __typename?: 'DataObjectOwnerWorkingGroup'
  /** Variant needs to have at least one property. This value is not used. */
  dummy?: Maybe<Scalars['Int']>
}

export type DataObjectOwnerWorkingGroupCreateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerWorkingGroupUpdateInput = {
  dummy?: Maybe<Scalars['Float']>
}

export type DataObjectOwnerWorkingGroupWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  dummy_eq?: Maybe<Scalars['Int']>
  dummy_gt?: Maybe<Scalars['Int']>
  dummy_gte?: Maybe<Scalars['Int']>
  dummy_lt?: Maybe<Scalars['Int']>
  dummy_lte?: Maybe<Scalars['Int']>
  dummy_in?: Maybe<Array<Scalars['Int']>>
}

export type DataObjectOwnerWorkingGroupWhereUniqueInput = {
  id: Scalars['ID']
}

export type DataObjectUpdateInput = {
  owner?: Maybe<Scalars['JSONObject']>
  addedAt?: Maybe<Scalars['Float']>
  typeId?: Maybe<Scalars['Float']>
  size?: Maybe<Scalars['BigInt']>
  liaisonId?: Maybe<Scalars['BigInt']>
  liaisonJudgement?: Maybe<LiaisonJudgement>
  ipfsContentId?: Maybe<Scalars['String']>
  joystreamContentId?: Maybe<Scalars['String']>
}

export type DataObjectWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  owner_json?: Maybe<Scalars['JSONObject']>
  addedAt_eq?: Maybe<Scalars['Int']>
  addedAt_gt?: Maybe<Scalars['Int']>
  addedAt_gte?: Maybe<Scalars['Int']>
  addedAt_lt?: Maybe<Scalars['Int']>
  addedAt_lte?: Maybe<Scalars['Int']>
  addedAt_in?: Maybe<Array<Scalars['Int']>>
  typeId_eq?: Maybe<Scalars['Int']>
  typeId_gt?: Maybe<Scalars['Int']>
  typeId_gte?: Maybe<Scalars['Int']>
  typeId_lt?: Maybe<Scalars['Int']>
  typeId_lte?: Maybe<Scalars['Int']>
  typeId_in?: Maybe<Array<Scalars['Int']>>
  size_eq?: Maybe<Scalars['BigInt']>
  size_gt?: Maybe<Scalars['BigInt']>
  size_gte?: Maybe<Scalars['BigInt']>
  size_lt?: Maybe<Scalars['BigInt']>
  size_lte?: Maybe<Scalars['BigInt']>
  size_in?: Maybe<Array<Scalars['BigInt']>>
  liaisonId_eq?: Maybe<Scalars['BigInt']>
  liaisonId_gt?: Maybe<Scalars['BigInt']>
  liaisonId_gte?: Maybe<Scalars['BigInt']>
  liaisonId_lt?: Maybe<Scalars['BigInt']>
  liaisonId_lte?: Maybe<Scalars['BigInt']>
  liaisonId_in?: Maybe<Array<Scalars['BigInt']>>
  liaisonJudgement_eq?: Maybe<LiaisonJudgement>
  liaisonJudgement_in?: Maybe<Array<LiaisonJudgement>>
  ipfsContentId_eq?: Maybe<Scalars['String']>
  ipfsContentId_contains?: Maybe<Scalars['String']>
  ipfsContentId_startsWith?: Maybe<Scalars['String']>
  ipfsContentId_endsWith?: Maybe<Scalars['String']>
  ipfsContentId_in?: Maybe<Array<Scalars['String']>>
  joystreamContentId_eq?: Maybe<Scalars['String']>
  joystreamContentId_contains?: Maybe<Scalars['String']>
  joystreamContentId_startsWith?: Maybe<Scalars['String']>
  joystreamContentId_endsWith?: Maybe<Scalars['String']>
  joystreamContentId_in?: Maybe<Array<Scalars['String']>>
}

export type DataObjectWhereUniqueInput = {
  id: Scalars['ID']
}

export type DeleteResponse = {
  id: Scalars['ID']
}

export type Event = BaseGraphQlObject & {
  __typename?: 'Event'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Hash of the extrinsic which caused the event to be emitted */
  inExtrinsic?: Maybe<Scalars['String']>
  /** Blocknumber of a block in which the event was emitted. */
  inBlock: Scalars['Int']
  /** Index of event in block from which it was emitted. */
  indexInBlock: Scalars['Int']
  /** Type of the event */
  type: EventType
  applicationwithdrawneventevent?: Maybe<Array<ApplicationWithdrawnEvent>>
  appliedonopeningeventevent?: Maybe<Array<AppliedOnOpeningEvent>>
  budgetseteventevent?: Maybe<Array<BudgetSetEvent>>
  budgetspendingeventevent?: Maybe<Array<BudgetSpendingEvent>>
  initialinvitationbalanceupdatedeventevent?: Maybe<Array<InitialInvitationBalanceUpdatedEvent>>
  initialinvitationcountupdatedeventevent?: Maybe<Array<InitialInvitationCountUpdatedEvent>>
  invitestransferredeventevent?: Maybe<Array<InvitesTransferredEvent>>
  leaderinvitationquotaupdatedeventevent?: Maybe<Array<LeaderInvitationQuotaUpdatedEvent>>
  leaderseteventevent?: Maybe<Array<LeaderSetEvent>>
  leaderunseteventevent?: Maybe<Array<LeaderUnsetEvent>>
  memberaccountsupdatedeventevent?: Maybe<Array<MemberAccountsUpdatedEvent>>
  memberinvitedeventevent?: Maybe<Array<MemberInvitedEvent>>
  memberprofileupdatedeventevent?: Maybe<Array<MemberProfileUpdatedEvent>>
  memberverificationstatusupdatedeventevent?: Maybe<Array<MemberVerificationStatusUpdatedEvent>>
  membershipboughteventevent?: Maybe<Array<MembershipBoughtEvent>>
  membershippriceupdatedeventevent?: Maybe<Array<MembershipPriceUpdatedEvent>>
  openingaddedeventevent?: Maybe<Array<OpeningAddedEvent>>
  openingcanceledeventevent?: Maybe<Array<OpeningCanceledEvent>>
  openingfilledeventevent?: Maybe<Array<OpeningFilledEvent>>
  referralcutupdatedeventevent?: Maybe<Array<ReferralCutUpdatedEvent>>
  rewardpaideventevent?: Maybe<Array<RewardPaidEvent>>
  stakedecreasedeventevent?: Maybe<Array<StakeDecreasedEvent>>
  stakeincreasedeventevent?: Maybe<Array<StakeIncreasedEvent>>
  stakeslashedeventevent?: Maybe<Array<StakeSlashedEvent>>
  stakingaccountaddedeventevent?: Maybe<Array<StakingAccountAddedEvent>>
  stakingaccountconfirmedeventevent?: Maybe<Array<StakingAccountConfirmedEvent>>
  stakingaccountremovedeventevent?: Maybe<Array<StakingAccountRemovedEvent>>
  statustextchangedeventevent?: Maybe<Array<StatusTextChangedEvent>>
  terminatedleadereventevent?: Maybe<Array<TerminatedLeaderEvent>>
  terminatedworkereventevent?: Maybe<Array<TerminatedWorkerEvent>>
  workerexitedeventevent?: Maybe<Array<WorkerExitedEvent>>
  workerrewardaccountupdatedeventevent?: Maybe<Array<WorkerRewardAccountUpdatedEvent>>
  workerrewardamountupdatedeventevent?: Maybe<Array<WorkerRewardAmountUpdatedEvent>>
  workerroleaccountupdatedeventevent?: Maybe<Array<WorkerRoleAccountUpdatedEvent>>
  workerstartedleavingeventevent?: Maybe<Array<WorkerStartedLeavingEvent>>
}

export type EventConnection = {
  __typename?: 'EventConnection'
  totalCount: Scalars['Int']
  edges: Array<EventEdge>
  pageInfo: PageInfo
}

export type EventCreateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock: Scalars['Float']
  indexInBlock: Scalars['Float']
  type: EventType
}

export type EventEdge = {
  __typename?: 'EventEdge'
  node: Event
  cursor: Scalars['String']
}

export enum EventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  InExtrinsicAsc = 'inExtrinsic_ASC',
  InExtrinsicDesc = 'inExtrinsic_DESC',
  InBlockAsc = 'inBlock_ASC',
  InBlockDesc = 'inBlock_DESC',
  IndexInBlockAsc = 'indexInBlock_ASC',
  IndexInBlockDesc = 'indexInBlock_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
}

export enum EventType {
  MembershipBought = 'MembershipBought',
  MemberInvited = 'MemberInvited',
  MemberProfileUpdated = 'MemberProfileUpdated',
  MemberAccountsUpdated = 'MemberAccountsUpdated',
  MemberVerificationStatusUpdated = 'MemberVerificationStatusUpdated',
  ReferralCutUpdated = 'ReferralCutUpdated',
  InvitesTransferred = 'InvitesTransferred',
  MembershipPriceUpdated = 'MembershipPriceUpdated',
  InitialInvitationBalanceUpdated = 'InitialInvitationBalanceUpdated',
  LeaderInvitationQuotaUpdated = 'LeaderInvitationQuotaUpdated',
  InitialInvitationCountUpdated = 'InitialInvitationCountUpdated',
  StakingAccountAddedEvent = 'StakingAccountAddedEvent',
  StakingAccountConfirmed = 'StakingAccountConfirmed',
  StakingAccountRemoved = 'StakingAccountRemoved',
  OpeningAdded = 'OpeningAdded',
  AppliedOnOpening = 'AppliedOnOpening',
  OpeningFilled = 'OpeningFilled',
  LeaderSet = 'LeaderSet',
  WorkerRoleAccountUpdated = 'WorkerRoleAccountUpdated',
  LeaderUnset = 'LeaderUnset',
  WorkerExited = 'WorkerExited',
  TerminatedWorker = 'TerminatedWorker',
  TerminatedLeader = 'TerminatedLeader',
  WorkerStartedLeaving = 'WorkerStartedLeaving',
  StakeSlashed = 'StakeSlashed',
  StakeDecreased = 'StakeDecreased',
  StakeIncreased = 'StakeIncreased',
  ApplicationWithdrawn = 'ApplicationWithdrawn',
  OpeningCanceled = 'OpeningCanceled',
  BudgetSet = 'BudgetSet',
  WorkerRewardAccountUpdated = 'WorkerRewardAccountUpdated',
  WorkerRewardAmountUpdated = 'WorkerRewardAmountUpdated',
  StatusTextChanged = 'StatusTextChanged',
  BudgetSpending = 'BudgetSpending',
  RewardPaid = 'RewardPaid',
  NewMissedRewardLevelReached = 'NewMissedRewardLevelReached',
}

export type EventUpdateInput = {
  inExtrinsic?: Maybe<Scalars['String']>
  inBlock?: Maybe<Scalars['Float']>
  indexInBlock?: Maybe<Scalars['Float']>
  type?: Maybe<EventType>
}

export type EventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  inExtrinsic_eq?: Maybe<Scalars['String']>
  inExtrinsic_contains?: Maybe<Scalars['String']>
  inExtrinsic_startsWith?: Maybe<Scalars['String']>
  inExtrinsic_endsWith?: Maybe<Scalars['String']>
  inExtrinsic_in?: Maybe<Array<Scalars['String']>>
  inBlock_eq?: Maybe<Scalars['Int']>
  inBlock_gt?: Maybe<Scalars['Int']>
  inBlock_gte?: Maybe<Scalars['Int']>
  inBlock_lt?: Maybe<Scalars['Int']>
  inBlock_lte?: Maybe<Scalars['Int']>
  inBlock_in?: Maybe<Array<Scalars['Int']>>
  indexInBlock_eq?: Maybe<Scalars['Int']>
  indexInBlock_gt?: Maybe<Scalars['Int']>
  indexInBlock_gte?: Maybe<Scalars['Int']>
  indexInBlock_lt?: Maybe<Scalars['Int']>
  indexInBlock_lte?: Maybe<Scalars['Int']>
  indexInBlock_in?: Maybe<Array<Scalars['Int']>>
  type_eq?: Maybe<EventType>
  type_in?: Maybe<Array<EventType>>
}

export type EventWhereUniqueInput = {
  id: Scalars['ID']
}

export type InitialInvitationBalanceUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'InitialInvitationBalanceUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  /** New initial invitation balance. */
  newInitialBalance: Scalars['BigInt']
}

export type InitialInvitationBalanceUpdatedEventConnection = {
  __typename?: 'InitialInvitationBalanceUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<InitialInvitationBalanceUpdatedEventEdge>
  pageInfo: PageInfo
}

export type InitialInvitationBalanceUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  newInitialBalance: Scalars['BigInt']
}

export type InitialInvitationBalanceUpdatedEventEdge = {
  __typename?: 'InitialInvitationBalanceUpdatedEventEdge'
  node: InitialInvitationBalanceUpdatedEvent
  cursor: Scalars['String']
}

export enum InitialInvitationBalanceUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  NewInitialBalanceAsc = 'newInitialBalance_ASC',
  NewInitialBalanceDesc = 'newInitialBalance_DESC',
}

export type InitialInvitationBalanceUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  newInitialBalance?: Maybe<Scalars['BigInt']>
}

export type InitialInvitationBalanceUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  newInitialBalance_eq?: Maybe<Scalars['BigInt']>
  newInitialBalance_gt?: Maybe<Scalars['BigInt']>
  newInitialBalance_gte?: Maybe<Scalars['BigInt']>
  newInitialBalance_lt?: Maybe<Scalars['BigInt']>
  newInitialBalance_lte?: Maybe<Scalars['BigInt']>
  newInitialBalance_in?: Maybe<Array<Scalars['BigInt']>>
}

export type InitialInvitationBalanceUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type InitialInvitationCountUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'InitialInvitationCountUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  /** New initial invitation count for members. */
  newInitialInvitationCount: Scalars['Int']
}

export type InitialInvitationCountUpdatedEventConnection = {
  __typename?: 'InitialInvitationCountUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<InitialInvitationCountUpdatedEventEdge>
  pageInfo: PageInfo
}

export type InitialInvitationCountUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  newInitialInvitationCount: Scalars['Float']
}

export type InitialInvitationCountUpdatedEventEdge = {
  __typename?: 'InitialInvitationCountUpdatedEventEdge'
  node: InitialInvitationCountUpdatedEvent
  cursor: Scalars['String']
}

export enum InitialInvitationCountUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  NewInitialInvitationCountAsc = 'newInitialInvitationCount_ASC',
  NewInitialInvitationCountDesc = 'newInitialInvitationCount_DESC',
}

export type InitialInvitationCountUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  newInitialInvitationCount?: Maybe<Scalars['Float']>
}

export type InitialInvitationCountUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  newInitialInvitationCount_eq?: Maybe<Scalars['Int']>
  newInitialInvitationCount_gt?: Maybe<Scalars['Int']>
  newInitialInvitationCount_gte?: Maybe<Scalars['Int']>
  newInitialInvitationCount_lt?: Maybe<Scalars['Int']>
  newInitialInvitationCount_lte?: Maybe<Scalars['Int']>
  newInitialInvitationCount_in?: Maybe<Array<Scalars['Int']>>
}

export type InitialInvitationCountUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type InvitesTransferredEvent = BaseGraphQlObject & {
  __typename?: 'InvitesTransferredEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  sourceMember: Membership
  sourceMemberId: Scalars['String']
  targetMember: Membership
  targetMemberId: Scalars['String']
  /** Number of invites transferred. */
  numberOfInvites: Scalars['Int']
}

export type InvitesTransferredEventConnection = {
  __typename?: 'InvitesTransferredEventConnection'
  totalCount: Scalars['Int']
  edges: Array<InvitesTransferredEventEdge>
  pageInfo: PageInfo
}

export type InvitesTransferredEventCreateInput = {
  eventId: Scalars['ID']
  sourceMemberId: Scalars['ID']
  targetMemberId: Scalars['ID']
  numberOfInvites: Scalars['Float']
}

export type InvitesTransferredEventEdge = {
  __typename?: 'InvitesTransferredEventEdge'
  node: InvitesTransferredEvent
  cursor: Scalars['String']
}

export enum InvitesTransferredEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  SourceMemberIdAsc = 'sourceMemberId_ASC',
  SourceMemberIdDesc = 'sourceMemberId_DESC',
  TargetMemberIdAsc = 'targetMemberId_ASC',
  TargetMemberIdDesc = 'targetMemberId_DESC',
  NumberOfInvitesAsc = 'numberOfInvites_ASC',
  NumberOfInvitesDesc = 'numberOfInvites_DESC',
}

export type InvitesTransferredEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  sourceMemberId?: Maybe<Scalars['ID']>
  targetMemberId?: Maybe<Scalars['ID']>
  numberOfInvites?: Maybe<Scalars['Float']>
}

export type InvitesTransferredEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  sourceMemberId_eq?: Maybe<Scalars['ID']>
  sourceMemberId_in?: Maybe<Array<Scalars['ID']>>
  targetMemberId_eq?: Maybe<Scalars['ID']>
  targetMemberId_in?: Maybe<Array<Scalars['ID']>>
  numberOfInvites_eq?: Maybe<Scalars['Int']>
  numberOfInvites_gt?: Maybe<Scalars['Int']>
  numberOfInvites_gte?: Maybe<Scalars['Int']>
  numberOfInvites_lt?: Maybe<Scalars['Int']>
  numberOfInvites_lte?: Maybe<Scalars['Int']>
  numberOfInvites_in?: Maybe<Array<Scalars['Int']>>
}

export type InvitesTransferredEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type LeaderInvitationQuotaUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'LeaderInvitationQuotaUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  /** New quota. */
  newInvitationQuota: Scalars['Int']
}

export type LeaderInvitationQuotaUpdatedEventConnection = {
  __typename?: 'LeaderInvitationQuotaUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<LeaderInvitationQuotaUpdatedEventEdge>
  pageInfo: PageInfo
}

export type LeaderInvitationQuotaUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  newInvitationQuota: Scalars['Float']
}

export type LeaderInvitationQuotaUpdatedEventEdge = {
  __typename?: 'LeaderInvitationQuotaUpdatedEventEdge'
  node: LeaderInvitationQuotaUpdatedEvent
  cursor: Scalars['String']
}

export enum LeaderInvitationQuotaUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  NewInvitationQuotaAsc = 'newInvitationQuota_ASC',
  NewInvitationQuotaDesc = 'newInvitationQuota_DESC',
}

export type LeaderInvitationQuotaUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  newInvitationQuota?: Maybe<Scalars['Float']>
}

export type LeaderInvitationQuotaUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  newInvitationQuota_eq?: Maybe<Scalars['Int']>
  newInvitationQuota_gt?: Maybe<Scalars['Int']>
  newInvitationQuota_gte?: Maybe<Scalars['Int']>
  newInvitationQuota_lt?: Maybe<Scalars['Int']>
  newInvitationQuota_lte?: Maybe<Scalars['Int']>
  newInvitationQuota_in?: Maybe<Array<Scalars['Int']>>
}

export type LeaderInvitationQuotaUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type LeaderSetEvent = BaseGraphQlObject & {
  __typename?: 'LeaderSetEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
}

export type LeaderSetEventConnection = {
  __typename?: 'LeaderSetEventConnection'
  totalCount: Scalars['Int']
  edges: Array<LeaderSetEventEdge>
  pageInfo: PageInfo
}

export type LeaderSetEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
}

export type LeaderSetEventEdge = {
  __typename?: 'LeaderSetEventEdge'
  node: LeaderSetEvent
  cursor: Scalars['String']
}

export enum LeaderSetEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
}

export type LeaderSetEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
}

export type LeaderSetEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
}

export type LeaderSetEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type LeaderUnsetEvent = BaseGraphQlObject & {
  __typename?: 'LeaderUnsetEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
}

export type LeaderUnsetEventConnection = {
  __typename?: 'LeaderUnsetEventConnection'
  totalCount: Scalars['Int']
  edges: Array<LeaderUnsetEventEdge>
  pageInfo: PageInfo
}

export type LeaderUnsetEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
}

export type LeaderUnsetEventEdge = {
  __typename?: 'LeaderUnsetEventEdge'
  node: LeaderUnsetEvent
  cursor: Scalars['String']
}

export enum LeaderUnsetEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
}

export type LeaderUnsetEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
}

export type LeaderUnsetEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
}

export type LeaderUnsetEventWhereUniqueInput = {
  id: Scalars['ID']
}

export enum LiaisonJudgement {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED',
}

export type MemberAccountsUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'MemberAccountsUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  member: Membership
  memberId: Scalars['String']
  /** New member root account in SS58 encoding. Null means no new value was provided. */
  newRootAccount?: Maybe<Scalars['String']>
  /** New member controller in SS58 encoding. Null means no new value was provided. */
  newControllerAccount?: Maybe<Scalars['String']>
}

export type MemberAccountsUpdatedEventConnection = {
  __typename?: 'MemberAccountsUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<MemberAccountsUpdatedEventEdge>
  pageInfo: PageInfo
}

export type MemberAccountsUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  memberId: Scalars['ID']
  newRootAccount?: Maybe<Scalars['String']>
  newControllerAccount?: Maybe<Scalars['String']>
}

export type MemberAccountsUpdatedEventEdge = {
  __typename?: 'MemberAccountsUpdatedEventEdge'
  node: MemberAccountsUpdatedEvent
  cursor: Scalars['String']
}

export enum MemberAccountsUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  MemberIdAsc = 'memberId_ASC',
  MemberIdDesc = 'memberId_DESC',
  NewRootAccountAsc = 'newRootAccount_ASC',
  NewRootAccountDesc = 'newRootAccount_DESC',
  NewControllerAccountAsc = 'newControllerAccount_ASC',
  NewControllerAccountDesc = 'newControllerAccount_DESC',
}

export type MemberAccountsUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  memberId?: Maybe<Scalars['ID']>
  newRootAccount?: Maybe<Scalars['String']>
  newControllerAccount?: Maybe<Scalars['String']>
}

export type MemberAccountsUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  memberId_eq?: Maybe<Scalars['ID']>
  memberId_in?: Maybe<Array<Scalars['ID']>>
  newRootAccount_eq?: Maybe<Scalars['String']>
  newRootAccount_contains?: Maybe<Scalars['String']>
  newRootAccount_startsWith?: Maybe<Scalars['String']>
  newRootAccount_endsWith?: Maybe<Scalars['String']>
  newRootAccount_in?: Maybe<Array<Scalars['String']>>
  newControllerAccount_eq?: Maybe<Scalars['String']>
  newControllerAccount_contains?: Maybe<Scalars['String']>
  newControllerAccount_startsWith?: Maybe<Scalars['String']>
  newControllerAccount_endsWith?: Maybe<Scalars['String']>
  newControllerAccount_in?: Maybe<Array<Scalars['String']>>
}

export type MemberAccountsUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type MemberInvitedEvent = BaseGraphQlObject & {
  __typename?: 'MemberInvitedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  invitingMember: Membership
  invitingMemberId: Scalars['String']
  newMember: Membership
  newMemberId: Scalars['String']
  /** New member root account in SS58 encoding. */
  rootAccount: Scalars['String']
  /** New member controller in SS58 encoding. */
  controllerAccount: Scalars['String']
  /** New member handle. */
  handle: Scalars['String']
  metadata: MemberMetadata
  metadataId: Scalars['String']
}

export type MemberInvitedEventConnection = {
  __typename?: 'MemberInvitedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<MemberInvitedEventEdge>
  pageInfo: PageInfo
}

export type MemberInvitedEventCreateInput = {
  eventId: Scalars['ID']
  invitingMemberId: Scalars['ID']
  newMemberId: Scalars['ID']
  rootAccount: Scalars['String']
  controllerAccount: Scalars['String']
  handle: Scalars['String']
  metadataId: Scalars['ID']
}

export type MemberInvitedEventEdge = {
  __typename?: 'MemberInvitedEventEdge'
  node: MemberInvitedEvent
  cursor: Scalars['String']
}

export enum MemberInvitedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  InvitingMemberIdAsc = 'invitingMemberId_ASC',
  InvitingMemberIdDesc = 'invitingMemberId_DESC',
  NewMemberIdAsc = 'newMemberId_ASC',
  NewMemberIdDesc = 'newMemberId_DESC',
  RootAccountAsc = 'rootAccount_ASC',
  RootAccountDesc = 'rootAccount_DESC',
  ControllerAccountAsc = 'controllerAccount_ASC',
  ControllerAccountDesc = 'controllerAccount_DESC',
  HandleAsc = 'handle_ASC',
  HandleDesc = 'handle_DESC',
  MetadataIdAsc = 'metadataId_ASC',
  MetadataIdDesc = 'metadataId_DESC',
}

export type MemberInvitedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  invitingMemberId?: Maybe<Scalars['ID']>
  newMemberId?: Maybe<Scalars['ID']>
  rootAccount?: Maybe<Scalars['String']>
  controllerAccount?: Maybe<Scalars['String']>
  handle?: Maybe<Scalars['String']>
  metadataId?: Maybe<Scalars['ID']>
}

export type MemberInvitedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  invitingMemberId_eq?: Maybe<Scalars['ID']>
  invitingMemberId_in?: Maybe<Array<Scalars['ID']>>
  newMemberId_eq?: Maybe<Scalars['ID']>
  newMemberId_in?: Maybe<Array<Scalars['ID']>>
  rootAccount_eq?: Maybe<Scalars['String']>
  rootAccount_contains?: Maybe<Scalars['String']>
  rootAccount_startsWith?: Maybe<Scalars['String']>
  rootAccount_endsWith?: Maybe<Scalars['String']>
  rootAccount_in?: Maybe<Array<Scalars['String']>>
  controllerAccount_eq?: Maybe<Scalars['String']>
  controllerAccount_contains?: Maybe<Scalars['String']>
  controllerAccount_startsWith?: Maybe<Scalars['String']>
  controllerAccount_endsWith?: Maybe<Scalars['String']>
  controllerAccount_in?: Maybe<Array<Scalars['String']>>
  handle_eq?: Maybe<Scalars['String']>
  handle_contains?: Maybe<Scalars['String']>
  handle_startsWith?: Maybe<Scalars['String']>
  handle_endsWith?: Maybe<Scalars['String']>
  handle_in?: Maybe<Array<Scalars['String']>>
  metadataId_eq?: Maybe<Scalars['ID']>
  metadataId_in?: Maybe<Array<Scalars['ID']>>
}

export type MemberInvitedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type MemberMetadata = BaseGraphQlObject & {
  __typename?: 'MemberMetadata'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Member's name */
  name?: Maybe<Scalars['String']>
  avatar?: Maybe<DataObject>
  avatarId?: Maybe<Scalars['String']>
  /** Short text chosen by member to share information about themselves */
  about?: Maybe<Scalars['String']>
  memberinvitedeventmetadata?: Maybe<Array<MemberInvitedEvent>>
  memberprofileupdatedeventnewMetadata?: Maybe<Array<MemberProfileUpdatedEvent>>
  membershipmetadata?: Maybe<Array<Membership>>
  membershipboughteventmetadata?: Maybe<Array<MembershipBoughtEvent>>
}

export type MemberMetadataConnection = {
  __typename?: 'MemberMetadataConnection'
  totalCount: Scalars['Int']
  edges: Array<MemberMetadataEdge>
  pageInfo: PageInfo
}

export type MemberMetadataCreateInput = {
  name?: Maybe<Scalars['String']>
  avatarId?: Maybe<Scalars['ID']>
  about?: Maybe<Scalars['String']>
}

export type MemberMetadataEdge = {
  __typename?: 'MemberMetadataEdge'
  node: MemberMetadata
  cursor: Scalars['String']
}

export enum MemberMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  AvatarIdAsc = 'avatarId_ASC',
  AvatarIdDesc = 'avatarId_DESC',
  AboutAsc = 'about_ASC',
  AboutDesc = 'about_DESC',
}

export type MemberMetadataUpdateInput = {
  name?: Maybe<Scalars['String']>
  avatarId?: Maybe<Scalars['ID']>
  about?: Maybe<Scalars['String']>
}

export type MemberMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  name_eq?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_startsWith?: Maybe<Scalars['String']>
  name_endsWith?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  avatarId_eq?: Maybe<Scalars['ID']>
  avatarId_in?: Maybe<Array<Scalars['ID']>>
  about_eq?: Maybe<Scalars['String']>
  about_contains?: Maybe<Scalars['String']>
  about_startsWith?: Maybe<Scalars['String']>
  about_endsWith?: Maybe<Scalars['String']>
  about_in?: Maybe<Array<Scalars['String']>>
}

export type MemberMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export type MemberProfileUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'MemberProfileUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  member: Membership
  memberId: Scalars['String']
  /** New member handle. Null means no new value was provided. */
  newHandle?: Maybe<Scalars['String']>
  newMetadata: MemberMetadata
  newMetadataId: Scalars['String']
}

export type MemberProfileUpdatedEventConnection = {
  __typename?: 'MemberProfileUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<MemberProfileUpdatedEventEdge>
  pageInfo: PageInfo
}

export type MemberProfileUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  memberId: Scalars['ID']
  newHandle?: Maybe<Scalars['String']>
  newMetadataId: Scalars['ID']
}

export type MemberProfileUpdatedEventEdge = {
  __typename?: 'MemberProfileUpdatedEventEdge'
  node: MemberProfileUpdatedEvent
  cursor: Scalars['String']
}

export enum MemberProfileUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  MemberIdAsc = 'memberId_ASC',
  MemberIdDesc = 'memberId_DESC',
  NewHandleAsc = 'newHandle_ASC',
  NewHandleDesc = 'newHandle_DESC',
  NewMetadataIdAsc = 'newMetadataId_ASC',
  NewMetadataIdDesc = 'newMetadataId_DESC',
}

export type MemberProfileUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  memberId?: Maybe<Scalars['ID']>
  newHandle?: Maybe<Scalars['String']>
  newMetadataId?: Maybe<Scalars['ID']>
}

export type MemberProfileUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  memberId_eq?: Maybe<Scalars['ID']>
  memberId_in?: Maybe<Array<Scalars['ID']>>
  newHandle_eq?: Maybe<Scalars['String']>
  newHandle_contains?: Maybe<Scalars['String']>
  newHandle_startsWith?: Maybe<Scalars['String']>
  newHandle_endsWith?: Maybe<Scalars['String']>
  newHandle_in?: Maybe<Array<Scalars['String']>>
  newMetadataId_eq?: Maybe<Scalars['ID']>
  newMetadataId_in?: Maybe<Array<Scalars['ID']>>
}

export type MemberProfileUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type MembersByHandleFtsOutput = {
  __typename?: 'MembersByHandleFTSOutput'
  item: MembersByHandleSearchResult
  rank: Scalars['Float']
  isTypeOf: Scalars['String']
  highlight: Scalars['String']
}

export type MembersByHandleSearchResult = Membership

/** Stored information about a registered user */
export type Membership = BaseGraphQlObject & {
  __typename?: 'Membership'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** The unique handle chosen by member */
  handle: Scalars['String']
  metadata: MemberMetadata
  metadataId: Scalars['String']
  /** Member's controller account id */
  controllerAccount: Scalars['String']
  /** Member's root account id */
  rootAccount: Scalars['String']
  /** Block number when member was registered */
  registeredAtBlock: Scalars['Int']
  /** Timestamp when member was registered */
  registeredAtTime: Scalars['DateTime']
  /** How the member was registered */
  entry: MembershipEntryMethod
  /** Whether member has been verified by membership working group. */
  isVerified: Scalars['Boolean']
  /** Staking accounts bounded to membership. */
  boundAccounts: Array<Scalars['String']>
  /** Current count of invites left to send. */
  inviteCount: Scalars['Int']
  invitees: Array<Membership>
  invitedBy?: Maybe<Membership>
  invitedById?: Maybe<Scalars['String']>
  referredMembers: Array<Membership>
  referredBy?: Maybe<Membership>
  referredById?: Maybe<Scalars['String']>
  /** Whether member is founding member. */
  isFoundingMember: Scalars['Boolean']
  roles: Array<Worker>
  invitestransferredeventsourceMember?: Maybe<Array<InvitesTransferredEvent>>
  invitestransferredeventtargetMember?: Maybe<Array<InvitesTransferredEvent>>
  memberaccountsupdatedeventmember?: Maybe<Array<MemberAccountsUpdatedEvent>>
  memberinvitedeventinvitingMember?: Maybe<Array<MemberInvitedEvent>>
  memberinvitedeventnewMember?: Maybe<Array<MemberInvitedEvent>>
  memberprofileupdatedeventmember?: Maybe<Array<MemberProfileUpdatedEvent>>
  memberverificationstatusupdatedeventmember?: Maybe<Array<MemberVerificationStatusUpdatedEvent>>
  membershipboughteventnewMember?: Maybe<Array<MembershipBoughtEvent>>
  membershipboughteventreferrer?: Maybe<Array<MembershipBoughtEvent>>
  stakingaccountaddedeventmember?: Maybe<Array<StakingAccountAddedEvent>>
  stakingaccountconfirmedeventmember?: Maybe<Array<StakingAccountConfirmedEvent>>
  stakingaccountremovedeventmember?: Maybe<Array<StakingAccountRemovedEvent>>
  workinggroupapplicationapplicant?: Maybe<Array<WorkingGroupApplication>>
}

export type MembershipBoughtEvent = BaseGraphQlObject & {
  __typename?: 'MembershipBoughtEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  newMember: Membership
  newMemberId: Scalars['String']
  /** New member root account in SS58 encoding. */
  rootAccount: Scalars['String']
  /** New member controller in SS58 encoding. */
  controllerAccount: Scalars['String']
  /** New member handle. */
  handle: Scalars['String']
  metadata: MemberMetadata
  metadataId: Scalars['String']
  referrer?: Maybe<Membership>
  referrerId?: Maybe<Scalars['String']>
}

export type MembershipBoughtEventConnection = {
  __typename?: 'MembershipBoughtEventConnection'
  totalCount: Scalars['Int']
  edges: Array<MembershipBoughtEventEdge>
  pageInfo: PageInfo
}

export type MembershipBoughtEventCreateInput = {
  eventId: Scalars['ID']
  newMemberId: Scalars['ID']
  rootAccount: Scalars['String']
  controllerAccount: Scalars['String']
  handle: Scalars['String']
  metadataId: Scalars['ID']
  referrerId?: Maybe<Scalars['ID']>
}

export type MembershipBoughtEventEdge = {
  __typename?: 'MembershipBoughtEventEdge'
  node: MembershipBoughtEvent
  cursor: Scalars['String']
}

export enum MembershipBoughtEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  NewMemberIdAsc = 'newMemberId_ASC',
  NewMemberIdDesc = 'newMemberId_DESC',
  RootAccountAsc = 'rootAccount_ASC',
  RootAccountDesc = 'rootAccount_DESC',
  ControllerAccountAsc = 'controllerAccount_ASC',
  ControllerAccountDesc = 'controllerAccount_DESC',
  HandleAsc = 'handle_ASC',
  HandleDesc = 'handle_DESC',
  MetadataIdAsc = 'metadataId_ASC',
  MetadataIdDesc = 'metadataId_DESC',
  ReferrerIdAsc = 'referrerId_ASC',
  ReferrerIdDesc = 'referrerId_DESC',
}

export type MembershipBoughtEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  newMemberId?: Maybe<Scalars['ID']>
  rootAccount?: Maybe<Scalars['String']>
  controllerAccount?: Maybe<Scalars['String']>
  handle?: Maybe<Scalars['String']>
  metadataId?: Maybe<Scalars['ID']>
  referrerId?: Maybe<Scalars['ID']>
}

export type MembershipBoughtEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  newMemberId_eq?: Maybe<Scalars['ID']>
  newMemberId_in?: Maybe<Array<Scalars['ID']>>
  rootAccount_eq?: Maybe<Scalars['String']>
  rootAccount_contains?: Maybe<Scalars['String']>
  rootAccount_startsWith?: Maybe<Scalars['String']>
  rootAccount_endsWith?: Maybe<Scalars['String']>
  rootAccount_in?: Maybe<Array<Scalars['String']>>
  controllerAccount_eq?: Maybe<Scalars['String']>
  controllerAccount_contains?: Maybe<Scalars['String']>
  controllerAccount_startsWith?: Maybe<Scalars['String']>
  controllerAccount_endsWith?: Maybe<Scalars['String']>
  controllerAccount_in?: Maybe<Array<Scalars['String']>>
  handle_eq?: Maybe<Scalars['String']>
  handle_contains?: Maybe<Scalars['String']>
  handle_startsWith?: Maybe<Scalars['String']>
  handle_endsWith?: Maybe<Scalars['String']>
  handle_in?: Maybe<Array<Scalars['String']>>
  metadataId_eq?: Maybe<Scalars['ID']>
  metadataId_in?: Maybe<Array<Scalars['ID']>>
  referrerId_eq?: Maybe<Scalars['ID']>
  referrerId_in?: Maybe<Array<Scalars['ID']>>
}

export type MembershipBoughtEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type MembershipConnection = {
  __typename?: 'MembershipConnection'
  totalCount: Scalars['Int']
  edges: Array<MembershipEdge>
  pageInfo: PageInfo
}

export type MembershipCreateInput = {
  handle: Scalars['String']
  metadataId: Scalars['ID']
  controllerAccount: Scalars['String']
  rootAccount: Scalars['String']
  registeredAtBlock: Scalars['Float']
  registeredAtTime: Scalars['DateTime']
  entry: MembershipEntryMethod
  isVerified: Scalars['Boolean']
  boundAccounts: Array<Scalars['String']>
  inviteCount: Scalars['Float']
  invitedById?: Maybe<Scalars['ID']>
  referredById?: Maybe<Scalars['ID']>
  isFoundingMember: Scalars['Boolean']
}

export type MembershipEdge = {
  __typename?: 'MembershipEdge'
  node: Membership
  cursor: Scalars['String']
}

export enum MembershipEntryMethod {
  Paid = 'PAID',
  Invited = 'INVITED',
  Genesis = 'GENESIS',
}

export enum MembershipOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  HandleAsc = 'handle_ASC',
  HandleDesc = 'handle_DESC',
  MetadataIdAsc = 'metadataId_ASC',
  MetadataIdDesc = 'metadataId_DESC',
  ControllerAccountAsc = 'controllerAccount_ASC',
  ControllerAccountDesc = 'controllerAccount_DESC',
  RootAccountAsc = 'rootAccount_ASC',
  RootAccountDesc = 'rootAccount_DESC',
  RegisteredAtBlockAsc = 'registeredAtBlock_ASC',
  RegisteredAtBlockDesc = 'registeredAtBlock_DESC',
  RegisteredAtTimeAsc = 'registeredAtTime_ASC',
  RegisteredAtTimeDesc = 'registeredAtTime_DESC',
  EntryAsc = 'entry_ASC',
  EntryDesc = 'entry_DESC',
  IsVerifiedAsc = 'isVerified_ASC',
  IsVerifiedDesc = 'isVerified_DESC',
  InviteCountAsc = 'inviteCount_ASC',
  InviteCountDesc = 'inviteCount_DESC',
  InvitedByIdAsc = 'invitedById_ASC',
  InvitedByIdDesc = 'invitedById_DESC',
  ReferredByIdAsc = 'referredById_ASC',
  ReferredByIdDesc = 'referredById_DESC',
  IsFoundingMemberAsc = 'isFoundingMember_ASC',
  IsFoundingMemberDesc = 'isFoundingMember_DESC',
}

export type MembershipPriceUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'MembershipPriceUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  /** The new membership price. */
  newPrice: Scalars['BigInt']
}

export type MembershipPriceUpdatedEventConnection = {
  __typename?: 'MembershipPriceUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<MembershipPriceUpdatedEventEdge>
  pageInfo: PageInfo
}

export type MembershipPriceUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  newPrice: Scalars['BigInt']
}

export type MembershipPriceUpdatedEventEdge = {
  __typename?: 'MembershipPriceUpdatedEventEdge'
  node: MembershipPriceUpdatedEvent
  cursor: Scalars['String']
}

export enum MembershipPriceUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  NewPriceAsc = 'newPrice_ASC',
  NewPriceDesc = 'newPrice_DESC',
}

export type MembershipPriceUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  newPrice?: Maybe<Scalars['BigInt']>
}

export type MembershipPriceUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  newPrice_eq?: Maybe<Scalars['BigInt']>
  newPrice_gt?: Maybe<Scalars['BigInt']>
  newPrice_gte?: Maybe<Scalars['BigInt']>
  newPrice_lt?: Maybe<Scalars['BigInt']>
  newPrice_lte?: Maybe<Scalars['BigInt']>
  newPrice_in?: Maybe<Array<Scalars['BigInt']>>
}

export type MembershipPriceUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type MembershipSystemSnapshot = BaseGraphQlObject & {
  __typename?: 'MembershipSystemSnapshot'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Block number of the snapshot block */
  snapshotBlock: Scalars['Int']
  /** Time of the snapshot (based on block timestamp) */
  snapshotTime: Scalars['DateTime']
  /** Initial invitation count of a new member. */
  defaultInviteCount: Scalars['Int']
  /** Current price to buy a membership. */
  membershipPrice: Scalars['BigInt']
  /** Percentage of tokens diverted to invitor. */
  referralCut: Scalars['Int']
  /** The initial, locked, balance credited to controller account of invitee. */
  invitedInitialBalance: Scalars['BigInt']
}

export type MembershipSystemSnapshotConnection = {
  __typename?: 'MembershipSystemSnapshotConnection'
  totalCount: Scalars['Int']
  edges: Array<MembershipSystemSnapshotEdge>
  pageInfo: PageInfo
}

export type MembershipSystemSnapshotCreateInput = {
  snapshotBlock: Scalars['Float']
  snapshotTime: Scalars['DateTime']
  defaultInviteCount: Scalars['Float']
  membershipPrice: Scalars['BigInt']
  referralCut: Scalars['Float']
  invitedInitialBalance: Scalars['BigInt']
}

export type MembershipSystemSnapshotEdge = {
  __typename?: 'MembershipSystemSnapshotEdge'
  node: MembershipSystemSnapshot
  cursor: Scalars['String']
}

export enum MembershipSystemSnapshotOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  SnapshotBlockAsc = 'snapshotBlock_ASC',
  SnapshotBlockDesc = 'snapshotBlock_DESC',
  SnapshotTimeAsc = 'snapshotTime_ASC',
  SnapshotTimeDesc = 'snapshotTime_DESC',
  DefaultInviteCountAsc = 'defaultInviteCount_ASC',
  DefaultInviteCountDesc = 'defaultInviteCount_DESC',
  MembershipPriceAsc = 'membershipPrice_ASC',
  MembershipPriceDesc = 'membershipPrice_DESC',
  ReferralCutAsc = 'referralCut_ASC',
  ReferralCutDesc = 'referralCut_DESC',
  InvitedInitialBalanceAsc = 'invitedInitialBalance_ASC',
  InvitedInitialBalanceDesc = 'invitedInitialBalance_DESC',
}

export type MembershipSystemSnapshotUpdateInput = {
  snapshotBlock?: Maybe<Scalars['Float']>
  snapshotTime?: Maybe<Scalars['DateTime']>
  defaultInviteCount?: Maybe<Scalars['Float']>
  membershipPrice?: Maybe<Scalars['BigInt']>
  referralCut?: Maybe<Scalars['Float']>
  invitedInitialBalance?: Maybe<Scalars['BigInt']>
}

export type MembershipSystemSnapshotWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  snapshotBlock_eq?: Maybe<Scalars['Int']>
  snapshotBlock_gt?: Maybe<Scalars['Int']>
  snapshotBlock_gte?: Maybe<Scalars['Int']>
  snapshotBlock_lt?: Maybe<Scalars['Int']>
  snapshotBlock_lte?: Maybe<Scalars['Int']>
  snapshotBlock_in?: Maybe<Array<Scalars['Int']>>
  snapshotTime_eq?: Maybe<Scalars['DateTime']>
  snapshotTime_lt?: Maybe<Scalars['DateTime']>
  snapshotTime_lte?: Maybe<Scalars['DateTime']>
  snapshotTime_gt?: Maybe<Scalars['DateTime']>
  snapshotTime_gte?: Maybe<Scalars['DateTime']>
  defaultInviteCount_eq?: Maybe<Scalars['Int']>
  defaultInviteCount_gt?: Maybe<Scalars['Int']>
  defaultInviteCount_gte?: Maybe<Scalars['Int']>
  defaultInviteCount_lt?: Maybe<Scalars['Int']>
  defaultInviteCount_lte?: Maybe<Scalars['Int']>
  defaultInviteCount_in?: Maybe<Array<Scalars['Int']>>
  membershipPrice_eq?: Maybe<Scalars['BigInt']>
  membershipPrice_gt?: Maybe<Scalars['BigInt']>
  membershipPrice_gte?: Maybe<Scalars['BigInt']>
  membershipPrice_lt?: Maybe<Scalars['BigInt']>
  membershipPrice_lte?: Maybe<Scalars['BigInt']>
  membershipPrice_in?: Maybe<Array<Scalars['BigInt']>>
  referralCut_eq?: Maybe<Scalars['Int']>
  referralCut_gt?: Maybe<Scalars['Int']>
  referralCut_gte?: Maybe<Scalars['Int']>
  referralCut_lt?: Maybe<Scalars['Int']>
  referralCut_lte?: Maybe<Scalars['Int']>
  referralCut_in?: Maybe<Array<Scalars['Int']>>
  invitedInitialBalance_eq?: Maybe<Scalars['BigInt']>
  invitedInitialBalance_gt?: Maybe<Scalars['BigInt']>
  invitedInitialBalance_gte?: Maybe<Scalars['BigInt']>
  invitedInitialBalance_lt?: Maybe<Scalars['BigInt']>
  invitedInitialBalance_lte?: Maybe<Scalars['BigInt']>
  invitedInitialBalance_in?: Maybe<Array<Scalars['BigInt']>>
}

export type MembershipSystemSnapshotWhereUniqueInput = {
  id: Scalars['ID']
}

export type MembershipUpdateInput = {
  handle?: Maybe<Scalars['String']>
  metadataId?: Maybe<Scalars['ID']>
  controllerAccount?: Maybe<Scalars['String']>
  rootAccount?: Maybe<Scalars['String']>
  registeredAtBlock?: Maybe<Scalars['Float']>
  registeredAtTime?: Maybe<Scalars['DateTime']>
  entry?: Maybe<MembershipEntryMethod>
  isVerified?: Maybe<Scalars['Boolean']>
  boundAccounts?: Maybe<Array<Scalars['String']>>
  inviteCount?: Maybe<Scalars['Float']>
  invitedById?: Maybe<Scalars['ID']>
  referredById?: Maybe<Scalars['ID']>
  isFoundingMember?: Maybe<Scalars['Boolean']>
}

export type MembershipWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  handle_eq?: Maybe<Scalars['String']>
  handle_contains?: Maybe<Scalars['String']>
  handle_startsWith?: Maybe<Scalars['String']>
  handle_endsWith?: Maybe<Scalars['String']>
  handle_in?: Maybe<Array<Scalars['String']>>
  metadataId_eq?: Maybe<Scalars['ID']>
  metadataId_in?: Maybe<Array<Scalars['ID']>>
  controllerAccount_eq?: Maybe<Scalars['String']>
  controllerAccount_contains?: Maybe<Scalars['String']>
  controllerAccount_startsWith?: Maybe<Scalars['String']>
  controllerAccount_endsWith?: Maybe<Scalars['String']>
  controllerAccount_in?: Maybe<Array<Scalars['String']>>
  rootAccount_eq?: Maybe<Scalars['String']>
  rootAccount_contains?: Maybe<Scalars['String']>
  rootAccount_startsWith?: Maybe<Scalars['String']>
  rootAccount_endsWith?: Maybe<Scalars['String']>
  rootAccount_in?: Maybe<Array<Scalars['String']>>
  registeredAtBlock_eq?: Maybe<Scalars['Int']>
  registeredAtBlock_gt?: Maybe<Scalars['Int']>
  registeredAtBlock_gte?: Maybe<Scalars['Int']>
  registeredAtBlock_lt?: Maybe<Scalars['Int']>
  registeredAtBlock_lte?: Maybe<Scalars['Int']>
  registeredAtBlock_in?: Maybe<Array<Scalars['Int']>>
  registeredAtTime_eq?: Maybe<Scalars['DateTime']>
  registeredAtTime_lt?: Maybe<Scalars['DateTime']>
  registeredAtTime_lte?: Maybe<Scalars['DateTime']>
  registeredAtTime_gt?: Maybe<Scalars['DateTime']>
  registeredAtTime_gte?: Maybe<Scalars['DateTime']>
  entry_eq?: Maybe<MembershipEntryMethod>
  entry_in?: Maybe<Array<MembershipEntryMethod>>
  isVerified_eq?: Maybe<Scalars['Boolean']>
  isVerified_in?: Maybe<Array<Scalars['Boolean']>>
  inviteCount_eq?: Maybe<Scalars['Int']>
  inviteCount_gt?: Maybe<Scalars['Int']>
  inviteCount_gte?: Maybe<Scalars['Int']>
  inviteCount_lt?: Maybe<Scalars['Int']>
  inviteCount_lte?: Maybe<Scalars['Int']>
  inviteCount_in?: Maybe<Array<Scalars['Int']>>
  invitedById_eq?: Maybe<Scalars['ID']>
  invitedById_in?: Maybe<Array<Scalars['ID']>>
  referredById_eq?: Maybe<Scalars['ID']>
  referredById_in?: Maybe<Array<Scalars['ID']>>
  isFoundingMember_eq?: Maybe<Scalars['Boolean']>
  isFoundingMember_in?: Maybe<Array<Scalars['Boolean']>>
}

export type MembershipWhereUniqueInput = {
  id?: Maybe<Scalars['ID']>
  handle?: Maybe<Scalars['String']>
}

export type MemberVerificationStatusUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'MemberVerificationStatusUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  member: Membership
  memberId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** New status. */
  isVerified: Scalars['Boolean']
}

export type MemberVerificationStatusUpdatedEventConnection = {
  __typename?: 'MemberVerificationStatusUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<MemberVerificationStatusUpdatedEventEdge>
  pageInfo: PageInfo
}

export type MemberVerificationStatusUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  memberId: Scalars['ID']
  workerId: Scalars['ID']
  isVerified: Scalars['Boolean']
}

export type MemberVerificationStatusUpdatedEventEdge = {
  __typename?: 'MemberVerificationStatusUpdatedEventEdge'
  node: MemberVerificationStatusUpdatedEvent
  cursor: Scalars['String']
}

export enum MemberVerificationStatusUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  MemberIdAsc = 'memberId_ASC',
  MemberIdDesc = 'memberId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  IsVerifiedAsc = 'isVerified_ASC',
  IsVerifiedDesc = 'isVerified_DESC',
}

export type MemberVerificationStatusUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  memberId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  isVerified?: Maybe<Scalars['Boolean']>
}

export type MemberVerificationStatusUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  memberId_eq?: Maybe<Scalars['ID']>
  memberId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  isVerified_eq?: Maybe<Scalars['Boolean']>
  isVerified_in?: Maybe<Array<Scalars['Boolean']>>
}

export type MemberVerificationStatusUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type OpeningAddedEvent = BaseGraphQlObject & {
  __typename?: 'OpeningAddedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  opening: WorkingGroupOpening
  openingId: Scalars['String']
}

export type OpeningAddedEventConnection = {
  __typename?: 'OpeningAddedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<OpeningAddedEventEdge>
  pageInfo: PageInfo
}

export type OpeningAddedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  openingId: Scalars['ID']
}

export type OpeningAddedEventEdge = {
  __typename?: 'OpeningAddedEventEdge'
  node: OpeningAddedEvent
  cursor: Scalars['String']
}

export enum OpeningAddedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  OpeningIdAsc = 'openingId_ASC',
  OpeningIdDesc = 'openingId_DESC',
}

export type OpeningAddedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  openingId?: Maybe<Scalars['ID']>
}

export type OpeningAddedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  openingId_eq?: Maybe<Scalars['ID']>
  openingId_in?: Maybe<Array<Scalars['ID']>>
}

export type OpeningAddedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type OpeningCanceledEvent = BaseGraphQlObject & {
  __typename?: 'OpeningCanceledEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  opening: WorkingGroupOpening
  openingId: Scalars['String']
}

export type OpeningCanceledEventConnection = {
  __typename?: 'OpeningCanceledEventConnection'
  totalCount: Scalars['Int']
  edges: Array<OpeningCanceledEventEdge>
  pageInfo: PageInfo
}

export type OpeningCanceledEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  openingId: Scalars['ID']
}

export type OpeningCanceledEventEdge = {
  __typename?: 'OpeningCanceledEventEdge'
  node: OpeningCanceledEvent
  cursor: Scalars['String']
}

export enum OpeningCanceledEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  OpeningIdAsc = 'openingId_ASC',
  OpeningIdDesc = 'openingId_DESC',
}

export type OpeningCanceledEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  openingId?: Maybe<Scalars['ID']>
}

export type OpeningCanceledEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  openingId_eq?: Maybe<Scalars['ID']>
  openingId_in?: Maybe<Array<Scalars['ID']>>
}

export type OpeningCanceledEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type OpeningFilledEvent = BaseGraphQlObject & {
  __typename?: 'OpeningFilledEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  opening: WorkingGroupOpening
  openingId: Scalars['String']
  workersHired: Array<Worker>
}

export type OpeningFilledEventConnection = {
  __typename?: 'OpeningFilledEventConnection'
  totalCount: Scalars['Int']
  edges: Array<OpeningFilledEventEdge>
  pageInfo: PageInfo
}

export type OpeningFilledEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  openingId: Scalars['ID']
}

export type OpeningFilledEventEdge = {
  __typename?: 'OpeningFilledEventEdge'
  node: OpeningFilledEvent
  cursor: Scalars['String']
}

export enum OpeningFilledEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  OpeningIdAsc = 'openingId_ASC',
  OpeningIdDesc = 'openingId_DESC',
}

export type OpeningFilledEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  openingId?: Maybe<Scalars['ID']>
}

export type OpeningFilledEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  openingId_eq?: Maybe<Scalars['ID']>
  openingId_in?: Maybe<Array<Scalars['ID']>>
}

export type OpeningFilledEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type OpeningStatusCancelled = {
  __typename?: 'OpeningStatusCancelled'
  openingCancelledEventId: Scalars['String']
}

export type OpeningStatusCancelledCreateInput = {
  openingCancelledEventId: Scalars['String']
}

export type OpeningStatusCancelledUpdateInput = {
  openingCancelledEventId?: Maybe<Scalars['String']>
}

export type OpeningStatusCancelledWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  openingCancelledEventId_eq?: Maybe<Scalars['String']>
  openingCancelledEventId_contains?: Maybe<Scalars['String']>
  openingCancelledEventId_startsWith?: Maybe<Scalars['String']>
  openingCancelledEventId_endsWith?: Maybe<Scalars['String']>
  openingCancelledEventId_in?: Maybe<Array<Scalars['String']>>
}

export type OpeningStatusCancelledWhereUniqueInput = {
  id: Scalars['ID']
}

export type OpeningStatusFilled = {
  __typename?: 'OpeningStatusFilled'
  openingFilledEventId: Scalars['String']
}

export type OpeningStatusFilledCreateInput = {
  openingFilledEventId: Scalars['String']
}

export type OpeningStatusFilledUpdateInput = {
  openingFilledEventId?: Maybe<Scalars['String']>
}

export type OpeningStatusFilledWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  openingFilledEventId_eq?: Maybe<Scalars['String']>
  openingFilledEventId_contains?: Maybe<Scalars['String']>
  openingFilledEventId_startsWith?: Maybe<Scalars['String']>
  openingFilledEventId_endsWith?: Maybe<Scalars['String']>
  openingFilledEventId_in?: Maybe<Array<Scalars['String']>>
}

export type OpeningStatusFilledWhereUniqueInput = {
  id: Scalars['ID']
}

export type OpeningStatusOpen = {
  __typename?: 'OpeningStatusOpen'
  phantom?: Maybe<Scalars['Int']>
}

export type OpeningStatusOpenCreateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type OpeningStatusOpenUpdateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type OpeningStatusOpenWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  phantom_eq?: Maybe<Scalars['Int']>
  phantom_gt?: Maybe<Scalars['Int']>
  phantom_gte?: Maybe<Scalars['Int']>
  phantom_lt?: Maybe<Scalars['Int']>
  phantom_lte?: Maybe<Scalars['Int']>
  phantom_in?: Maybe<Array<Scalars['Int']>>
}

export type OpeningStatusOpenWhereUniqueInput = {
  id: Scalars['ID']
}

export type PageInfo = {
  __typename?: 'PageInfo'
  hasNextPage: Scalars['Boolean']
  hasPreviousPage: Scalars['Boolean']
  startCursor?: Maybe<Scalars['String']>
  endCursor?: Maybe<Scalars['String']>
}

export type ProcessorState = {
  __typename?: 'ProcessorState'
  lastCompleteBlock: Scalars['Float']
  lastProcessedEvent: Scalars['String']
  indexerHead: Scalars['Float']
  chainHead: Scalars['Float']
}

export type Query = {
  __typename?: 'Query'
  applicationFormQuestionAnswers: Array<ApplicationFormQuestionAnswer>
  applicationFormQuestionAnswerByUniqueInput?: Maybe<ApplicationFormQuestionAnswer>
  applicationFormQuestionAnswersConnection: ApplicationFormQuestionAnswerConnection
  applicationFormQuestions: Array<ApplicationFormQuestion>
  applicationFormQuestionByUniqueInput?: Maybe<ApplicationFormQuestion>
  applicationFormQuestionsConnection: ApplicationFormQuestionConnection
  applicationWithdrawnEvents: Array<ApplicationWithdrawnEvent>
  applicationWithdrawnEventByUniqueInput?: Maybe<ApplicationWithdrawnEvent>
  applicationWithdrawnEventsConnection: ApplicationWithdrawnEventConnection
  appliedOnOpeningEvents: Array<AppliedOnOpeningEvent>
  appliedOnOpeningEventByUniqueInput?: Maybe<AppliedOnOpeningEvent>
  appliedOnOpeningEventsConnection: AppliedOnOpeningEventConnection
  budgetSetEvents: Array<BudgetSetEvent>
  budgetSetEventByUniqueInput?: Maybe<BudgetSetEvent>
  budgetSetEventsConnection: BudgetSetEventConnection
  budgetSpendingEvents: Array<BudgetSpendingEvent>
  budgetSpendingEventByUniqueInput?: Maybe<BudgetSpendingEvent>
  budgetSpendingEventsConnection: BudgetSpendingEventConnection
  dataObjects: Array<DataObject>
  dataObjectByUniqueInput?: Maybe<DataObject>
  dataObjectsConnection: DataObjectConnection
  events: Array<Event>
  eventByUniqueInput?: Maybe<Event>
  eventsConnection: EventConnection
  initialInvitationBalanceUpdatedEvents: Array<InitialInvitationBalanceUpdatedEvent>
  initialInvitationBalanceUpdatedEventByUniqueInput?: Maybe<InitialInvitationBalanceUpdatedEvent>
  initialInvitationBalanceUpdatedEventsConnection: InitialInvitationBalanceUpdatedEventConnection
  initialInvitationCountUpdatedEvents: Array<InitialInvitationCountUpdatedEvent>
  initialInvitationCountUpdatedEventByUniqueInput?: Maybe<InitialInvitationCountUpdatedEvent>
  initialInvitationCountUpdatedEventsConnection: InitialInvitationCountUpdatedEventConnection
  invitesTransferredEvents: Array<InvitesTransferredEvent>
  invitesTransferredEventByUniqueInput?: Maybe<InvitesTransferredEvent>
  invitesTransferredEventsConnection: InvitesTransferredEventConnection
  leaderInvitationQuotaUpdatedEvents: Array<LeaderInvitationQuotaUpdatedEvent>
  leaderInvitationQuotaUpdatedEventByUniqueInput?: Maybe<LeaderInvitationQuotaUpdatedEvent>
  leaderInvitationQuotaUpdatedEventsConnection: LeaderInvitationQuotaUpdatedEventConnection
  leaderSetEvents: Array<LeaderSetEvent>
  leaderSetEventByUniqueInput?: Maybe<LeaderSetEvent>
  leaderSetEventsConnection: LeaderSetEventConnection
  leaderUnsetEvents: Array<LeaderUnsetEvent>
  leaderUnsetEventByUniqueInput?: Maybe<LeaderUnsetEvent>
  leaderUnsetEventsConnection: LeaderUnsetEventConnection
  memberAccountsUpdatedEvents: Array<MemberAccountsUpdatedEvent>
  memberAccountsUpdatedEventByUniqueInput?: Maybe<MemberAccountsUpdatedEvent>
  memberAccountsUpdatedEventsConnection: MemberAccountsUpdatedEventConnection
  memberInvitedEvents: Array<MemberInvitedEvent>
  memberInvitedEventByUniqueInput?: Maybe<MemberInvitedEvent>
  memberInvitedEventsConnection: MemberInvitedEventConnection
  memberMetadata: Array<MemberMetadata>
  memberMetadataByUniqueInput?: Maybe<MemberMetadata>
  memberMetadataConnection: MemberMetadataConnection
  memberProfileUpdatedEvents: Array<MemberProfileUpdatedEvent>
  memberProfileUpdatedEventByUniqueInput?: Maybe<MemberProfileUpdatedEvent>
  memberProfileUpdatedEventsConnection: MemberProfileUpdatedEventConnection
  memberVerificationStatusUpdatedEvents: Array<MemberVerificationStatusUpdatedEvent>
  memberVerificationStatusUpdatedEventByUniqueInput?: Maybe<MemberVerificationStatusUpdatedEvent>
  memberVerificationStatusUpdatedEventsConnection: MemberVerificationStatusUpdatedEventConnection
  membershipBoughtEvents: Array<MembershipBoughtEvent>
  membershipBoughtEventByUniqueInput?: Maybe<MembershipBoughtEvent>
  membershipBoughtEventsConnection: MembershipBoughtEventConnection
  membershipPriceUpdatedEvents: Array<MembershipPriceUpdatedEvent>
  membershipPriceUpdatedEventByUniqueInput?: Maybe<MembershipPriceUpdatedEvent>
  membershipPriceUpdatedEventsConnection: MembershipPriceUpdatedEventConnection
  membershipSystemSnapshots: Array<MembershipSystemSnapshot>
  membershipSystemSnapshotByUniqueInput?: Maybe<MembershipSystemSnapshot>
  membershipSystemSnapshotsConnection: MembershipSystemSnapshotConnection
  memberships: Array<Membership>
  membershipByUniqueInput?: Maybe<Membership>
  membershipsConnection: MembershipConnection
  openingAddedEvents: Array<OpeningAddedEvent>
  openingAddedEventByUniqueInput?: Maybe<OpeningAddedEvent>
  openingAddedEventsConnection: OpeningAddedEventConnection
  openingCanceledEvents: Array<OpeningCanceledEvent>
  openingCanceledEventByUniqueInput?: Maybe<OpeningCanceledEvent>
  openingCanceledEventsConnection: OpeningCanceledEventConnection
  openingFilledEvents: Array<OpeningFilledEvent>
  openingFilledEventByUniqueInput?: Maybe<OpeningFilledEvent>
  openingFilledEventsConnection: OpeningFilledEventConnection
  membersByHandle: Array<MembersByHandleFtsOutput>
  referralCutUpdatedEvents: Array<ReferralCutUpdatedEvent>
  referralCutUpdatedEventByUniqueInput?: Maybe<ReferralCutUpdatedEvent>
  referralCutUpdatedEventsConnection: ReferralCutUpdatedEventConnection
  rewardPaidEvents: Array<RewardPaidEvent>
  rewardPaidEventByUniqueInput?: Maybe<RewardPaidEvent>
  rewardPaidEventsConnection: RewardPaidEventConnection
  stakeDecreasedEvents: Array<StakeDecreasedEvent>
  stakeDecreasedEventByUniqueInput?: Maybe<StakeDecreasedEvent>
  stakeDecreasedEventsConnection: StakeDecreasedEventConnection
  stakeIncreasedEvents: Array<StakeIncreasedEvent>
  stakeIncreasedEventByUniqueInput?: Maybe<StakeIncreasedEvent>
  stakeIncreasedEventsConnection: StakeIncreasedEventConnection
  stakeSlashedEvents: Array<StakeSlashedEvent>
  stakeSlashedEventByUniqueInput?: Maybe<StakeSlashedEvent>
  stakeSlashedEventsConnection: StakeSlashedEventConnection
  stakingAccountAddedEvents: Array<StakingAccountAddedEvent>
  stakingAccountAddedEventByUniqueInput?: Maybe<StakingAccountAddedEvent>
  stakingAccountAddedEventsConnection: StakingAccountAddedEventConnection
  stakingAccountConfirmedEvents: Array<StakingAccountConfirmedEvent>
  stakingAccountConfirmedEventByUniqueInput?: Maybe<StakingAccountConfirmedEvent>
  stakingAccountConfirmedEventsConnection: StakingAccountConfirmedEventConnection
  stakingAccountRemovedEvents: Array<StakingAccountRemovedEvent>
  stakingAccountRemovedEventByUniqueInput?: Maybe<StakingAccountRemovedEvent>
  stakingAccountRemovedEventsConnection: StakingAccountRemovedEventConnection
  statusTextChangedEvents: Array<StatusTextChangedEvent>
  statusTextChangedEventByUniqueInput?: Maybe<StatusTextChangedEvent>
  statusTextChangedEventsConnection: StatusTextChangedEventConnection
  terminatedLeaderEvents: Array<TerminatedLeaderEvent>
  terminatedLeaderEventByUniqueInput?: Maybe<TerminatedLeaderEvent>
  terminatedLeaderEventsConnection: TerminatedLeaderEventConnection
  terminatedWorkerEvents: Array<TerminatedWorkerEvent>
  terminatedWorkerEventByUniqueInput?: Maybe<TerminatedWorkerEvent>
  terminatedWorkerEventsConnection: TerminatedWorkerEventConnection
  workerExitedEvents: Array<WorkerExitedEvent>
  workerExitedEventByUniqueInput?: Maybe<WorkerExitedEvent>
  workerExitedEventsConnection: WorkerExitedEventConnection
  workerRewardAccountUpdatedEvents: Array<WorkerRewardAccountUpdatedEvent>
  workerRewardAccountUpdatedEventByUniqueInput?: Maybe<WorkerRewardAccountUpdatedEvent>
  workerRewardAccountUpdatedEventsConnection: WorkerRewardAccountUpdatedEventConnection
  workerRewardAmountUpdatedEvents: Array<WorkerRewardAmountUpdatedEvent>
  workerRewardAmountUpdatedEventByUniqueInput?: Maybe<WorkerRewardAmountUpdatedEvent>
  workerRewardAmountUpdatedEventsConnection: WorkerRewardAmountUpdatedEventConnection
  workerRoleAccountUpdatedEvents: Array<WorkerRoleAccountUpdatedEvent>
  workerRoleAccountUpdatedEventByUniqueInput?: Maybe<WorkerRoleAccountUpdatedEvent>
  workerRoleAccountUpdatedEventsConnection: WorkerRoleAccountUpdatedEventConnection
  workerStartedLeavingEvents: Array<WorkerStartedLeavingEvent>
  workerStartedLeavingEventByUniqueInput?: Maybe<WorkerStartedLeavingEvent>
  workerStartedLeavingEventsConnection: WorkerStartedLeavingEventConnection
  workers: Array<Worker>
  workerByUniqueInput?: Maybe<Worker>
  workersConnection: WorkerConnection
  workingGroupApplications: Array<WorkingGroupApplication>
  workingGroupApplicationByUniqueInput?: Maybe<WorkingGroupApplication>
  workingGroupApplicationsConnection: WorkingGroupApplicationConnection
  workingGroupMetadata: Array<WorkingGroupMetadata>
  workingGroupMetadataByUniqueInput?: Maybe<WorkingGroupMetadata>
  workingGroupMetadataConnection: WorkingGroupMetadataConnection
  workingGroupOpeningMetadata: Array<WorkingGroupOpeningMetadata>
  workingGroupOpeningMetadataByUniqueInput?: Maybe<WorkingGroupOpeningMetadata>
  workingGroupOpeningMetadataConnection: WorkingGroupOpeningMetadataConnection
  workingGroupOpenings: Array<WorkingGroupOpening>
  workingGroupOpeningByUniqueInput?: Maybe<WorkingGroupOpening>
  workingGroupOpeningsConnection: WorkingGroupOpeningConnection
  workingGroups: Array<WorkingGroup>
  workingGroupByUniqueInput?: Maybe<WorkingGroup>
  workingGroupsConnection: WorkingGroupConnection
}

export type QueryApplicationFormQuestionAnswersArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ApplicationFormQuestionAnswerWhereInput>
  orderBy?: Maybe<ApplicationFormQuestionAnswerOrderByInput>
}

export type QueryApplicationFormQuestionAnswerByUniqueInputArgs = {
  where: ApplicationFormQuestionAnswerWhereUniqueInput
}

export type QueryApplicationFormQuestionAnswersConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ApplicationFormQuestionAnswerWhereInput>
  orderBy?: Maybe<ApplicationFormQuestionAnswerOrderByInput>
}

export type QueryApplicationFormQuestionsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ApplicationFormQuestionWhereInput>
  orderBy?: Maybe<ApplicationFormQuestionOrderByInput>
}

export type QueryApplicationFormQuestionByUniqueInputArgs = {
  where: ApplicationFormQuestionWhereUniqueInput
}

export type QueryApplicationFormQuestionsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ApplicationFormQuestionWhereInput>
  orderBy?: Maybe<ApplicationFormQuestionOrderByInput>
}

export type QueryApplicationWithdrawnEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ApplicationWithdrawnEventWhereInput>
  orderBy?: Maybe<ApplicationWithdrawnEventOrderByInput>
}

export type QueryApplicationWithdrawnEventByUniqueInputArgs = {
  where: ApplicationWithdrawnEventWhereUniqueInput
}

export type QueryApplicationWithdrawnEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ApplicationWithdrawnEventWhereInput>
  orderBy?: Maybe<ApplicationWithdrawnEventOrderByInput>
}

export type QueryAppliedOnOpeningEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<AppliedOnOpeningEventWhereInput>
  orderBy?: Maybe<AppliedOnOpeningEventOrderByInput>
}

export type QueryAppliedOnOpeningEventByUniqueInputArgs = {
  where: AppliedOnOpeningEventWhereUniqueInput
}

export type QueryAppliedOnOpeningEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<AppliedOnOpeningEventWhereInput>
  orderBy?: Maybe<AppliedOnOpeningEventOrderByInput>
}

export type QueryBudgetSetEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<BudgetSetEventWhereInput>
  orderBy?: Maybe<BudgetSetEventOrderByInput>
}

export type QueryBudgetSetEventByUniqueInputArgs = {
  where: BudgetSetEventWhereUniqueInput
}

export type QueryBudgetSetEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<BudgetSetEventWhereInput>
  orderBy?: Maybe<BudgetSetEventOrderByInput>
}

export type QueryBudgetSpendingEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<BudgetSpendingEventWhereInput>
  orderBy?: Maybe<BudgetSpendingEventOrderByInput>
}

export type QueryBudgetSpendingEventByUniqueInputArgs = {
  where: BudgetSpendingEventWhereUniqueInput
}

export type QueryBudgetSpendingEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<BudgetSpendingEventWhereInput>
  orderBy?: Maybe<BudgetSpendingEventOrderByInput>
}

export type QueryDataObjectsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<DataObjectWhereInput>
  orderBy?: Maybe<DataObjectOrderByInput>
}

export type QueryDataObjectByUniqueInputArgs = {
  where: DataObjectWhereUniqueInput
}

export type QueryDataObjectsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<DataObjectWhereInput>
  orderBy?: Maybe<DataObjectOrderByInput>
}

export type QueryEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<EventWhereInput>
  orderBy?: Maybe<EventOrderByInput>
}

export type QueryEventByUniqueInputArgs = {
  where: EventWhereUniqueInput
}

export type QueryEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<EventWhereInput>
  orderBy?: Maybe<EventOrderByInput>
}

export type QueryInitialInvitationBalanceUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<InitialInvitationBalanceUpdatedEventWhereInput>
  orderBy?: Maybe<InitialInvitationBalanceUpdatedEventOrderByInput>
}

export type QueryInitialInvitationBalanceUpdatedEventByUniqueInputArgs = {
  where: InitialInvitationBalanceUpdatedEventWhereUniqueInput
}

export type QueryInitialInvitationBalanceUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<InitialInvitationBalanceUpdatedEventWhereInput>
  orderBy?: Maybe<InitialInvitationBalanceUpdatedEventOrderByInput>
}

export type QueryInitialInvitationCountUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<InitialInvitationCountUpdatedEventWhereInput>
  orderBy?: Maybe<InitialInvitationCountUpdatedEventOrderByInput>
}

export type QueryInitialInvitationCountUpdatedEventByUniqueInputArgs = {
  where: InitialInvitationCountUpdatedEventWhereUniqueInput
}

export type QueryInitialInvitationCountUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<InitialInvitationCountUpdatedEventWhereInput>
  orderBy?: Maybe<InitialInvitationCountUpdatedEventOrderByInput>
}

export type QueryInvitesTransferredEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<InvitesTransferredEventWhereInput>
  orderBy?: Maybe<InvitesTransferredEventOrderByInput>
}

export type QueryInvitesTransferredEventByUniqueInputArgs = {
  where: InvitesTransferredEventWhereUniqueInput
}

export type QueryInvitesTransferredEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<InvitesTransferredEventWhereInput>
  orderBy?: Maybe<InvitesTransferredEventOrderByInput>
}

export type QueryLeaderInvitationQuotaUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<LeaderInvitationQuotaUpdatedEventWhereInput>
  orderBy?: Maybe<LeaderInvitationQuotaUpdatedEventOrderByInput>
}

export type QueryLeaderInvitationQuotaUpdatedEventByUniqueInputArgs = {
  where: LeaderInvitationQuotaUpdatedEventWhereUniqueInput
}

export type QueryLeaderInvitationQuotaUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<LeaderInvitationQuotaUpdatedEventWhereInput>
  orderBy?: Maybe<LeaderInvitationQuotaUpdatedEventOrderByInput>
}

export type QueryLeaderSetEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<LeaderSetEventWhereInput>
  orderBy?: Maybe<LeaderSetEventOrderByInput>
}

export type QueryLeaderSetEventByUniqueInputArgs = {
  where: LeaderSetEventWhereUniqueInput
}

export type QueryLeaderSetEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<LeaderSetEventWhereInput>
  orderBy?: Maybe<LeaderSetEventOrderByInput>
}

export type QueryLeaderUnsetEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<LeaderUnsetEventWhereInput>
  orderBy?: Maybe<LeaderUnsetEventOrderByInput>
}

export type QueryLeaderUnsetEventByUniqueInputArgs = {
  where: LeaderUnsetEventWhereUniqueInput
}

export type QueryLeaderUnsetEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<LeaderUnsetEventWhereInput>
  orderBy?: Maybe<LeaderUnsetEventOrderByInput>
}

export type QueryMemberAccountsUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MemberAccountsUpdatedEventWhereInput>
  orderBy?: Maybe<MemberAccountsUpdatedEventOrderByInput>
}

export type QueryMemberAccountsUpdatedEventByUniqueInputArgs = {
  where: MemberAccountsUpdatedEventWhereUniqueInput
}

export type QueryMemberAccountsUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MemberAccountsUpdatedEventWhereInput>
  orderBy?: Maybe<MemberAccountsUpdatedEventOrderByInput>
}

export type QueryMemberInvitedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MemberInvitedEventWhereInput>
  orderBy?: Maybe<MemberInvitedEventOrderByInput>
}

export type QueryMemberInvitedEventByUniqueInputArgs = {
  where: MemberInvitedEventWhereUniqueInput
}

export type QueryMemberInvitedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MemberInvitedEventWhereInput>
  orderBy?: Maybe<MemberInvitedEventOrderByInput>
}

export type QueryMemberMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MemberMetadataWhereInput>
  orderBy?: Maybe<MemberMetadataOrderByInput>
}

export type QueryMemberMetadataByUniqueInputArgs = {
  where: MemberMetadataWhereUniqueInput
}

export type QueryMemberMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MemberMetadataWhereInput>
  orderBy?: Maybe<MemberMetadataOrderByInput>
}

export type QueryMemberProfileUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MemberProfileUpdatedEventWhereInput>
  orderBy?: Maybe<MemberProfileUpdatedEventOrderByInput>
}

export type QueryMemberProfileUpdatedEventByUniqueInputArgs = {
  where: MemberProfileUpdatedEventWhereUniqueInput
}

export type QueryMemberProfileUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MemberProfileUpdatedEventWhereInput>
  orderBy?: Maybe<MemberProfileUpdatedEventOrderByInput>
}

export type QueryMemberVerificationStatusUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MemberVerificationStatusUpdatedEventWhereInput>
  orderBy?: Maybe<MemberVerificationStatusUpdatedEventOrderByInput>
}

export type QueryMemberVerificationStatusUpdatedEventByUniqueInputArgs = {
  where: MemberVerificationStatusUpdatedEventWhereUniqueInput
}

export type QueryMemberVerificationStatusUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MemberVerificationStatusUpdatedEventWhereInput>
  orderBy?: Maybe<MemberVerificationStatusUpdatedEventOrderByInput>
}

export type QueryMembershipBoughtEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MembershipBoughtEventWhereInput>
  orderBy?: Maybe<MembershipBoughtEventOrderByInput>
}

export type QueryMembershipBoughtEventByUniqueInputArgs = {
  where: MembershipBoughtEventWhereUniqueInput
}

export type QueryMembershipBoughtEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MembershipBoughtEventWhereInput>
  orderBy?: Maybe<MembershipBoughtEventOrderByInput>
}

export type QueryMembershipPriceUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MembershipPriceUpdatedEventWhereInput>
  orderBy?: Maybe<MembershipPriceUpdatedEventOrderByInput>
}

export type QueryMembershipPriceUpdatedEventByUniqueInputArgs = {
  where: MembershipPriceUpdatedEventWhereUniqueInput
}

export type QueryMembershipPriceUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MembershipPriceUpdatedEventWhereInput>
  orderBy?: Maybe<MembershipPriceUpdatedEventOrderByInput>
}

export type QueryMembershipSystemSnapshotsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MembershipSystemSnapshotWhereInput>
  orderBy?: Maybe<MembershipSystemSnapshotOrderByInput>
}

export type QueryMembershipSystemSnapshotByUniqueInputArgs = {
  where: MembershipSystemSnapshotWhereUniqueInput
}

export type QueryMembershipSystemSnapshotsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MembershipSystemSnapshotWhereInput>
  orderBy?: Maybe<MembershipSystemSnapshotOrderByInput>
}

export type QueryMembershipsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<MembershipWhereInput>
  orderBy?: Maybe<MembershipOrderByInput>
}

export type QueryMembershipByUniqueInputArgs = {
  where: MembershipWhereUniqueInput
}

export type QueryMembershipsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<MembershipWhereInput>
  orderBy?: Maybe<MembershipOrderByInput>
}

export type QueryOpeningAddedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OpeningAddedEventWhereInput>
  orderBy?: Maybe<OpeningAddedEventOrderByInput>
}

export type QueryOpeningAddedEventByUniqueInputArgs = {
  where: OpeningAddedEventWhereUniqueInput
}

export type QueryOpeningAddedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OpeningAddedEventWhereInput>
  orderBy?: Maybe<OpeningAddedEventOrderByInput>
}

export type QueryOpeningCanceledEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OpeningCanceledEventWhereInput>
  orderBy?: Maybe<OpeningCanceledEventOrderByInput>
}

export type QueryOpeningCanceledEventByUniqueInputArgs = {
  where: OpeningCanceledEventWhereUniqueInput
}

export type QueryOpeningCanceledEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OpeningCanceledEventWhereInput>
  orderBy?: Maybe<OpeningCanceledEventOrderByInput>
}

export type QueryOpeningFilledEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<OpeningFilledEventWhereInput>
  orderBy?: Maybe<OpeningFilledEventOrderByInput>
}

export type QueryOpeningFilledEventByUniqueInputArgs = {
  where: OpeningFilledEventWhereUniqueInput
}

export type QueryOpeningFilledEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<OpeningFilledEventWhereInput>
  orderBy?: Maybe<OpeningFilledEventOrderByInput>
}

export type QueryMembersByHandleArgs = {
  whereMembership?: Maybe<MembershipWhereInput>
  skip?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  text: Scalars['String']
}

export type QueryReferralCutUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<ReferralCutUpdatedEventWhereInput>
  orderBy?: Maybe<ReferralCutUpdatedEventOrderByInput>
}

export type QueryReferralCutUpdatedEventByUniqueInputArgs = {
  where: ReferralCutUpdatedEventWhereUniqueInput
}

export type QueryReferralCutUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<ReferralCutUpdatedEventWhereInput>
  orderBy?: Maybe<ReferralCutUpdatedEventOrderByInput>
}

export type QueryRewardPaidEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<RewardPaidEventWhereInput>
  orderBy?: Maybe<RewardPaidEventOrderByInput>
}

export type QueryRewardPaidEventByUniqueInputArgs = {
  where: RewardPaidEventWhereUniqueInput
}

export type QueryRewardPaidEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<RewardPaidEventWhereInput>
  orderBy?: Maybe<RewardPaidEventOrderByInput>
}

export type QueryStakeDecreasedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StakeDecreasedEventWhereInput>
  orderBy?: Maybe<StakeDecreasedEventOrderByInput>
}

export type QueryStakeDecreasedEventByUniqueInputArgs = {
  where: StakeDecreasedEventWhereUniqueInput
}

export type QueryStakeDecreasedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StakeDecreasedEventWhereInput>
  orderBy?: Maybe<StakeDecreasedEventOrderByInput>
}

export type QueryStakeIncreasedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StakeIncreasedEventWhereInput>
  orderBy?: Maybe<StakeIncreasedEventOrderByInput>
}

export type QueryStakeIncreasedEventByUniqueInputArgs = {
  where: StakeIncreasedEventWhereUniqueInput
}

export type QueryStakeIncreasedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StakeIncreasedEventWhereInput>
  orderBy?: Maybe<StakeIncreasedEventOrderByInput>
}

export type QueryStakeSlashedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StakeSlashedEventWhereInput>
  orderBy?: Maybe<StakeSlashedEventOrderByInput>
}

export type QueryStakeSlashedEventByUniqueInputArgs = {
  where: StakeSlashedEventWhereUniqueInput
}

export type QueryStakeSlashedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StakeSlashedEventWhereInput>
  orderBy?: Maybe<StakeSlashedEventOrderByInput>
}

export type QueryStakingAccountAddedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StakingAccountAddedEventWhereInput>
  orderBy?: Maybe<StakingAccountAddedEventOrderByInput>
}

export type QueryStakingAccountAddedEventByUniqueInputArgs = {
  where: StakingAccountAddedEventWhereUniqueInput
}

export type QueryStakingAccountAddedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StakingAccountAddedEventWhereInput>
  orderBy?: Maybe<StakingAccountAddedEventOrderByInput>
}

export type QueryStakingAccountConfirmedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StakingAccountConfirmedEventWhereInput>
  orderBy?: Maybe<StakingAccountConfirmedEventOrderByInput>
}

export type QueryStakingAccountConfirmedEventByUniqueInputArgs = {
  where: StakingAccountConfirmedEventWhereUniqueInput
}

export type QueryStakingAccountConfirmedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StakingAccountConfirmedEventWhereInput>
  orderBy?: Maybe<StakingAccountConfirmedEventOrderByInput>
}

export type QueryStakingAccountRemovedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StakingAccountRemovedEventWhereInput>
  orderBy?: Maybe<StakingAccountRemovedEventOrderByInput>
}

export type QueryStakingAccountRemovedEventByUniqueInputArgs = {
  where: StakingAccountRemovedEventWhereUniqueInput
}

export type QueryStakingAccountRemovedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StakingAccountRemovedEventWhereInput>
  orderBy?: Maybe<StakingAccountRemovedEventOrderByInput>
}

export type QueryStatusTextChangedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<StatusTextChangedEventWhereInput>
  orderBy?: Maybe<StatusTextChangedEventOrderByInput>
}

export type QueryStatusTextChangedEventByUniqueInputArgs = {
  where: StatusTextChangedEventWhereUniqueInput
}

export type QueryStatusTextChangedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<StatusTextChangedEventWhereInput>
  orderBy?: Maybe<StatusTextChangedEventOrderByInput>
}

export type QueryTerminatedLeaderEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<TerminatedLeaderEventWhereInput>
  orderBy?: Maybe<TerminatedLeaderEventOrderByInput>
}

export type QueryTerminatedLeaderEventByUniqueInputArgs = {
  where: TerminatedLeaderEventWhereUniqueInput
}

export type QueryTerminatedLeaderEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<TerminatedLeaderEventWhereInput>
  orderBy?: Maybe<TerminatedLeaderEventOrderByInput>
}

export type QueryTerminatedWorkerEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<TerminatedWorkerEventWhereInput>
  orderBy?: Maybe<TerminatedWorkerEventOrderByInput>
}

export type QueryTerminatedWorkerEventByUniqueInputArgs = {
  where: TerminatedWorkerEventWhereUniqueInput
}

export type QueryTerminatedWorkerEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<TerminatedWorkerEventWhereInput>
  orderBy?: Maybe<TerminatedWorkerEventOrderByInput>
}

export type QueryWorkerExitedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerExitedEventWhereInput>
  orderBy?: Maybe<WorkerExitedEventOrderByInput>
}

export type QueryWorkerExitedEventByUniqueInputArgs = {
  where: WorkerExitedEventWhereUniqueInput
}

export type QueryWorkerExitedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerExitedEventWhereInput>
  orderBy?: Maybe<WorkerExitedEventOrderByInput>
}

export type QueryWorkerRewardAccountUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerRewardAccountUpdatedEventWhereInput>
  orderBy?: Maybe<WorkerRewardAccountUpdatedEventOrderByInput>
}

export type QueryWorkerRewardAccountUpdatedEventByUniqueInputArgs = {
  where: WorkerRewardAccountUpdatedEventWhereUniqueInput
}

export type QueryWorkerRewardAccountUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerRewardAccountUpdatedEventWhereInput>
  orderBy?: Maybe<WorkerRewardAccountUpdatedEventOrderByInput>
}

export type QueryWorkerRewardAmountUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerRewardAmountUpdatedEventWhereInput>
  orderBy?: Maybe<WorkerRewardAmountUpdatedEventOrderByInput>
}

export type QueryWorkerRewardAmountUpdatedEventByUniqueInputArgs = {
  where: WorkerRewardAmountUpdatedEventWhereUniqueInput
}

export type QueryWorkerRewardAmountUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerRewardAmountUpdatedEventWhereInput>
  orderBy?: Maybe<WorkerRewardAmountUpdatedEventOrderByInput>
}

export type QueryWorkerRoleAccountUpdatedEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerRoleAccountUpdatedEventWhereInput>
  orderBy?: Maybe<WorkerRoleAccountUpdatedEventOrderByInput>
}

export type QueryWorkerRoleAccountUpdatedEventByUniqueInputArgs = {
  where: WorkerRoleAccountUpdatedEventWhereUniqueInput
}

export type QueryWorkerRoleAccountUpdatedEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerRoleAccountUpdatedEventWhereInput>
  orderBy?: Maybe<WorkerRoleAccountUpdatedEventOrderByInput>
}

export type QueryWorkerStartedLeavingEventsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerStartedLeavingEventWhereInput>
  orderBy?: Maybe<WorkerStartedLeavingEventOrderByInput>
}

export type QueryWorkerStartedLeavingEventByUniqueInputArgs = {
  where: WorkerStartedLeavingEventWhereUniqueInput
}

export type QueryWorkerStartedLeavingEventsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerStartedLeavingEventWhereInput>
  orderBy?: Maybe<WorkerStartedLeavingEventOrderByInput>
}

export type QueryWorkersArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkerWhereInput>
  orderBy?: Maybe<WorkerOrderByInput>
}

export type QueryWorkerByUniqueInputArgs = {
  where: WorkerWhereUniqueInput
}

export type QueryWorkersConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkerWhereInput>
  orderBy?: Maybe<WorkerOrderByInput>
}

export type QueryWorkingGroupApplicationsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkingGroupApplicationWhereInput>
  orderBy?: Maybe<WorkingGroupApplicationOrderByInput>
}

export type QueryWorkingGroupApplicationByUniqueInputArgs = {
  where: WorkingGroupApplicationWhereUniqueInput
}

export type QueryWorkingGroupApplicationsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkingGroupApplicationWhereInput>
  orderBy?: Maybe<WorkingGroupApplicationOrderByInput>
}

export type QueryWorkingGroupMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkingGroupMetadataWhereInput>
  orderBy?: Maybe<WorkingGroupMetadataOrderByInput>
}

export type QueryWorkingGroupMetadataByUniqueInputArgs = {
  where: WorkingGroupMetadataWhereUniqueInput
}

export type QueryWorkingGroupMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkingGroupMetadataWhereInput>
  orderBy?: Maybe<WorkingGroupMetadataOrderByInput>
}

export type QueryWorkingGroupOpeningMetadataArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkingGroupOpeningMetadataWhereInput>
  orderBy?: Maybe<WorkingGroupOpeningMetadataOrderByInput>
}

export type QueryWorkingGroupOpeningMetadataByUniqueInputArgs = {
  where: WorkingGroupOpeningMetadataWhereUniqueInput
}

export type QueryWorkingGroupOpeningMetadataConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkingGroupOpeningMetadataWhereInput>
  orderBy?: Maybe<WorkingGroupOpeningMetadataOrderByInput>
}

export type QueryWorkingGroupOpeningsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkingGroupOpeningWhereInput>
  orderBy?: Maybe<WorkingGroupOpeningOrderByInput>
}

export type QueryWorkingGroupOpeningByUniqueInputArgs = {
  where: WorkingGroupOpeningWhereUniqueInput
}

export type QueryWorkingGroupOpeningsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkingGroupOpeningWhereInput>
  orderBy?: Maybe<WorkingGroupOpeningOrderByInput>
}

export type QueryWorkingGroupsArgs = {
  offset?: Maybe<Scalars['Int']>
  limit?: Maybe<Scalars['Int']>
  where?: Maybe<WorkingGroupWhereInput>
  orderBy?: Maybe<WorkingGroupOrderByInput>
}

export type QueryWorkingGroupByUniqueInputArgs = {
  where: WorkingGroupWhereUniqueInput
}

export type QueryWorkingGroupsConnectionArgs = {
  first?: Maybe<Scalars['Int']>
  after?: Maybe<Scalars['String']>
  last?: Maybe<Scalars['Int']>
  before?: Maybe<Scalars['String']>
  where?: Maybe<WorkingGroupWhereInput>
  orderBy?: Maybe<WorkingGroupOrderByInput>
}

export type ReferralCutUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'ReferralCutUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  /** New cut value. */
  newValue: Scalars['Int']
}

export type ReferralCutUpdatedEventConnection = {
  __typename?: 'ReferralCutUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<ReferralCutUpdatedEventEdge>
  pageInfo: PageInfo
}

export type ReferralCutUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  newValue: Scalars['Float']
}

export type ReferralCutUpdatedEventEdge = {
  __typename?: 'ReferralCutUpdatedEventEdge'
  node: ReferralCutUpdatedEvent
  cursor: Scalars['String']
}

export enum ReferralCutUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  NewValueAsc = 'newValue_ASC',
  NewValueDesc = 'newValue_DESC',
}

export type ReferralCutUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  newValue?: Maybe<Scalars['Float']>
}

export type ReferralCutUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  newValue_eq?: Maybe<Scalars['Int']>
  newValue_gt?: Maybe<Scalars['Int']>
  newValue_gte?: Maybe<Scalars['Int']>
  newValue_lt?: Maybe<Scalars['Int']>
  newValue_lte?: Maybe<Scalars['Int']>
  newValue_in?: Maybe<Array<Scalars['Int']>>
}

export type ReferralCutUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type RewardPaidEvent = BaseGraphQlObject & {
  __typename?: 'RewardPaidEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** The account that recieved the reward */
  rewardAccount: Scalars['String']
  /** Amount recieved */
  amount: Scalars['BigInt']
}

export type RewardPaidEventConnection = {
  __typename?: 'RewardPaidEventConnection'
  totalCount: Scalars['Int']
  edges: Array<RewardPaidEventEdge>
  pageInfo: PageInfo
}

export type RewardPaidEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  rewardAccount: Scalars['String']
  amount: Scalars['BigInt']
}

export type RewardPaidEventEdge = {
  __typename?: 'RewardPaidEventEdge'
  node: RewardPaidEvent
  cursor: Scalars['String']
}

export enum RewardPaidEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  RewardAccountAsc = 'rewardAccount_ASC',
  RewardAccountDesc = 'rewardAccount_DESC',
  AmountAsc = 'amount_ASC',
  AmountDesc = 'amount_DESC',
}

export type RewardPaidEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  rewardAccount?: Maybe<Scalars['String']>
  amount?: Maybe<Scalars['BigInt']>
}

export type RewardPaidEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  rewardAccount_eq?: Maybe<Scalars['String']>
  rewardAccount_contains?: Maybe<Scalars['String']>
  rewardAccount_startsWith?: Maybe<Scalars['String']>
  rewardAccount_endsWith?: Maybe<Scalars['String']>
  rewardAccount_in?: Maybe<Array<Scalars['String']>>
  amount_eq?: Maybe<Scalars['BigInt']>
  amount_gt?: Maybe<Scalars['BigInt']>
  amount_gte?: Maybe<Scalars['BigInt']>
  amount_lt?: Maybe<Scalars['BigInt']>
  amount_lte?: Maybe<Scalars['BigInt']>
  amount_in?: Maybe<Array<Scalars['BigInt']>>
}

export type RewardPaidEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type StakeDecreasedEvent = BaseGraphQlObject & {
  __typename?: 'StakeDecreasedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** The amount of JOY the stake was decreased by */
  amount: Scalars['BigInt']
}

export type StakeDecreasedEventConnection = {
  __typename?: 'StakeDecreasedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<StakeDecreasedEventEdge>
  pageInfo: PageInfo
}

export type StakeDecreasedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  amount: Scalars['BigInt']
}

export type StakeDecreasedEventEdge = {
  __typename?: 'StakeDecreasedEventEdge'
  node: StakeDecreasedEvent
  cursor: Scalars['String']
}

export enum StakeDecreasedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  AmountAsc = 'amount_ASC',
  AmountDesc = 'amount_DESC',
}

export type StakeDecreasedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  amount?: Maybe<Scalars['BigInt']>
}

export type StakeDecreasedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  amount_eq?: Maybe<Scalars['BigInt']>
  amount_gt?: Maybe<Scalars['BigInt']>
  amount_gte?: Maybe<Scalars['BigInt']>
  amount_lt?: Maybe<Scalars['BigInt']>
  amount_lte?: Maybe<Scalars['BigInt']>
  amount_in?: Maybe<Array<Scalars['BigInt']>>
}

export type StakeDecreasedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type StakeIncreasedEvent = BaseGraphQlObject & {
  __typename?: 'StakeIncreasedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** The amount of JOY the stake was increased by */
  amount: Scalars['BigInt']
}

export type StakeIncreasedEventConnection = {
  __typename?: 'StakeIncreasedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<StakeIncreasedEventEdge>
  pageInfo: PageInfo
}

export type StakeIncreasedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  amount: Scalars['BigInt']
}

export type StakeIncreasedEventEdge = {
  __typename?: 'StakeIncreasedEventEdge'
  node: StakeIncreasedEvent
  cursor: Scalars['String']
}

export enum StakeIncreasedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  AmountAsc = 'amount_ASC',
  AmountDesc = 'amount_DESC',
}

export type StakeIncreasedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  amount?: Maybe<Scalars['BigInt']>
}

export type StakeIncreasedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  amount_eq?: Maybe<Scalars['BigInt']>
  amount_gt?: Maybe<Scalars['BigInt']>
  amount_gte?: Maybe<Scalars['BigInt']>
  amount_lt?: Maybe<Scalars['BigInt']>
  amount_lte?: Maybe<Scalars['BigInt']>
  amount_in?: Maybe<Array<Scalars['BigInt']>>
}

export type StakeIncreasedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type StakeSlashedEvent = BaseGraphQlObject & {
  __typename?: 'StakeSlashedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** Balance that was requested to be slashed */
  requestedAmount: Scalars['BigInt']
  /** Balance that was actually slashed */
  slashedAmount: Scalars['BigInt']
  /** Optional rationale */
  rationale?: Maybe<Scalars['String']>
}

export type StakeSlashedEventConnection = {
  __typename?: 'StakeSlashedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<StakeSlashedEventEdge>
  pageInfo: PageInfo
}

export type StakeSlashedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  requestedAmount: Scalars['BigInt']
  slashedAmount: Scalars['BigInt']
  rationale?: Maybe<Scalars['String']>
}

export type StakeSlashedEventEdge = {
  __typename?: 'StakeSlashedEventEdge'
  node: StakeSlashedEvent
  cursor: Scalars['String']
}

export enum StakeSlashedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  RequestedAmountAsc = 'requestedAmount_ASC',
  RequestedAmountDesc = 'requestedAmount_DESC',
  SlashedAmountAsc = 'slashedAmount_ASC',
  SlashedAmountDesc = 'slashedAmount_DESC',
  RationaleAsc = 'rationale_ASC',
  RationaleDesc = 'rationale_DESC',
}

export type StakeSlashedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  requestedAmount?: Maybe<Scalars['BigInt']>
  slashedAmount?: Maybe<Scalars['BigInt']>
  rationale?: Maybe<Scalars['String']>
}

export type StakeSlashedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  requestedAmount_eq?: Maybe<Scalars['BigInt']>
  requestedAmount_gt?: Maybe<Scalars['BigInt']>
  requestedAmount_gte?: Maybe<Scalars['BigInt']>
  requestedAmount_lt?: Maybe<Scalars['BigInt']>
  requestedAmount_lte?: Maybe<Scalars['BigInt']>
  requestedAmount_in?: Maybe<Array<Scalars['BigInt']>>
  slashedAmount_eq?: Maybe<Scalars['BigInt']>
  slashedAmount_gt?: Maybe<Scalars['BigInt']>
  slashedAmount_gte?: Maybe<Scalars['BigInt']>
  slashedAmount_lt?: Maybe<Scalars['BigInt']>
  slashedAmount_lte?: Maybe<Scalars['BigInt']>
  slashedAmount_in?: Maybe<Array<Scalars['BigInt']>>
  rationale_eq?: Maybe<Scalars['String']>
  rationale_contains?: Maybe<Scalars['String']>
  rationale_startsWith?: Maybe<Scalars['String']>
  rationale_endsWith?: Maybe<Scalars['String']>
  rationale_in?: Maybe<Array<Scalars['String']>>
}

export type StakeSlashedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type StakingAccountAddedEvent = BaseGraphQlObject & {
  __typename?: 'StakingAccountAddedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  member: Membership
  memberId: Scalars['String']
  /** New staking account in SS58 encoding. */
  account: Scalars['String']
}

export type StakingAccountAddedEventConnection = {
  __typename?: 'StakingAccountAddedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<StakingAccountAddedEventEdge>
  pageInfo: PageInfo
}

export type StakingAccountAddedEventCreateInput = {
  eventId: Scalars['ID']
  memberId: Scalars['ID']
  account: Scalars['String']
}

export type StakingAccountAddedEventEdge = {
  __typename?: 'StakingAccountAddedEventEdge'
  node: StakingAccountAddedEvent
  cursor: Scalars['String']
}

export enum StakingAccountAddedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  MemberIdAsc = 'memberId_ASC',
  MemberIdDesc = 'memberId_DESC',
  AccountAsc = 'account_ASC',
  AccountDesc = 'account_DESC',
}

export type StakingAccountAddedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  memberId?: Maybe<Scalars['ID']>
  account?: Maybe<Scalars['String']>
}

export type StakingAccountAddedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  memberId_eq?: Maybe<Scalars['ID']>
  memberId_in?: Maybe<Array<Scalars['ID']>>
  account_eq?: Maybe<Scalars['String']>
  account_contains?: Maybe<Scalars['String']>
  account_startsWith?: Maybe<Scalars['String']>
  account_endsWith?: Maybe<Scalars['String']>
  account_in?: Maybe<Array<Scalars['String']>>
}

export type StakingAccountAddedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type StakingAccountConfirmedEvent = BaseGraphQlObject & {
  __typename?: 'StakingAccountConfirmedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  member: Membership
  memberId: Scalars['String']
  /** New staking account in SS58 encoding. */
  account: Scalars['String']
}

export type StakingAccountConfirmedEventConnection = {
  __typename?: 'StakingAccountConfirmedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<StakingAccountConfirmedEventEdge>
  pageInfo: PageInfo
}

export type StakingAccountConfirmedEventCreateInput = {
  eventId: Scalars['ID']
  memberId: Scalars['ID']
  account: Scalars['String']
}

export type StakingAccountConfirmedEventEdge = {
  __typename?: 'StakingAccountConfirmedEventEdge'
  node: StakingAccountConfirmedEvent
  cursor: Scalars['String']
}

export enum StakingAccountConfirmedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  MemberIdAsc = 'memberId_ASC',
  MemberIdDesc = 'memberId_DESC',
  AccountAsc = 'account_ASC',
  AccountDesc = 'account_DESC',
}

export type StakingAccountConfirmedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  memberId?: Maybe<Scalars['ID']>
  account?: Maybe<Scalars['String']>
}

export type StakingAccountConfirmedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  memberId_eq?: Maybe<Scalars['ID']>
  memberId_in?: Maybe<Array<Scalars['ID']>>
  account_eq?: Maybe<Scalars['String']>
  account_contains?: Maybe<Scalars['String']>
  account_startsWith?: Maybe<Scalars['String']>
  account_endsWith?: Maybe<Scalars['String']>
  account_in?: Maybe<Array<Scalars['String']>>
}

export type StakingAccountConfirmedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type StakingAccountRemovedEvent = BaseGraphQlObject & {
  __typename?: 'StakingAccountRemovedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  member: Membership
  memberId: Scalars['String']
  /** New staking account in SS58 encoding. */
  account: Scalars['String']
}

export type StakingAccountRemovedEventConnection = {
  __typename?: 'StakingAccountRemovedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<StakingAccountRemovedEventEdge>
  pageInfo: PageInfo
}

export type StakingAccountRemovedEventCreateInput = {
  eventId: Scalars['ID']
  memberId: Scalars['ID']
  account: Scalars['String']
}

export type StakingAccountRemovedEventEdge = {
  __typename?: 'StakingAccountRemovedEventEdge'
  node: StakingAccountRemovedEvent
  cursor: Scalars['String']
}

export enum StakingAccountRemovedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  MemberIdAsc = 'memberId_ASC',
  MemberIdDesc = 'memberId_DESC',
  AccountAsc = 'account_ASC',
  AccountDesc = 'account_DESC',
}

export type StakingAccountRemovedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  memberId?: Maybe<Scalars['ID']>
  account?: Maybe<Scalars['String']>
}

export type StakingAccountRemovedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  memberId_eq?: Maybe<Scalars['ID']>
  memberId_in?: Maybe<Array<Scalars['ID']>>
  account_eq?: Maybe<Scalars['String']>
  account_contains?: Maybe<Scalars['String']>
  account_startsWith?: Maybe<Scalars['String']>
  account_endsWith?: Maybe<Scalars['String']>
  account_in?: Maybe<Array<Scalars['String']>>
}

export type StakingAccountRemovedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type StandardDeleteResponse = {
  __typename?: 'StandardDeleteResponse'
  id: Scalars['ID']
}

export type StatusTextChangedEvent = BaseGraphQlObject & {
  __typename?: 'StatusTextChangedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  metadata: WorkingGroupMetadata
  metadataId: Scalars['String']
}

export type StatusTextChangedEventConnection = {
  __typename?: 'StatusTextChangedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<StatusTextChangedEventEdge>
  pageInfo: PageInfo
}

export type StatusTextChangedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  metadataId: Scalars['ID']
}

export type StatusTextChangedEventEdge = {
  __typename?: 'StatusTextChangedEventEdge'
  node: StatusTextChangedEvent
  cursor: Scalars['String']
}

export enum StatusTextChangedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  MetadataIdAsc = 'metadataId_ASC',
  MetadataIdDesc = 'metadataId_DESC',
}

export type StatusTextChangedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  metadataId?: Maybe<Scalars['ID']>
}

export type StatusTextChangedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  metadataId_eq?: Maybe<Scalars['ID']>
  metadataId_in?: Maybe<Array<Scalars['ID']>>
}

export type StatusTextChangedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type Subscription = {
  __typename?: 'Subscription'
  stateSubscription: ProcessorState
}

export type TerminatedLeaderEvent = BaseGraphQlObject & {
  __typename?: 'TerminatedLeaderEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** Slash amount (if any) */
  penalty?: Maybe<Scalars['BigInt']>
  /** Optional rationale */
  rationale?: Maybe<Scalars['String']>
}

export type TerminatedLeaderEventConnection = {
  __typename?: 'TerminatedLeaderEventConnection'
  totalCount: Scalars['Int']
  edges: Array<TerminatedLeaderEventEdge>
  pageInfo: PageInfo
}

export type TerminatedLeaderEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  penalty?: Maybe<Scalars['BigInt']>
  rationale?: Maybe<Scalars['String']>
}

export type TerminatedLeaderEventEdge = {
  __typename?: 'TerminatedLeaderEventEdge'
  node: TerminatedLeaderEvent
  cursor: Scalars['String']
}

export enum TerminatedLeaderEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  PenaltyAsc = 'penalty_ASC',
  PenaltyDesc = 'penalty_DESC',
  RationaleAsc = 'rationale_ASC',
  RationaleDesc = 'rationale_DESC',
}

export type TerminatedLeaderEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  penalty?: Maybe<Scalars['BigInt']>
  rationale?: Maybe<Scalars['String']>
}

export type TerminatedLeaderEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  penalty_eq?: Maybe<Scalars['BigInt']>
  penalty_gt?: Maybe<Scalars['BigInt']>
  penalty_gte?: Maybe<Scalars['BigInt']>
  penalty_lt?: Maybe<Scalars['BigInt']>
  penalty_lte?: Maybe<Scalars['BigInt']>
  penalty_in?: Maybe<Array<Scalars['BigInt']>>
  rationale_eq?: Maybe<Scalars['String']>
  rationale_contains?: Maybe<Scalars['String']>
  rationale_startsWith?: Maybe<Scalars['String']>
  rationale_endsWith?: Maybe<Scalars['String']>
  rationale_in?: Maybe<Array<Scalars['String']>>
}

export type TerminatedLeaderEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type TerminatedWorkerEvent = BaseGraphQlObject & {
  __typename?: 'TerminatedWorkerEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** Slash amount (if any) */
  penalty?: Maybe<Scalars['BigInt']>
  /** Optional rationale */
  rationale?: Maybe<Scalars['String']>
}

export type TerminatedWorkerEventConnection = {
  __typename?: 'TerminatedWorkerEventConnection'
  totalCount: Scalars['Int']
  edges: Array<TerminatedWorkerEventEdge>
  pageInfo: PageInfo
}

export type TerminatedWorkerEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  penalty?: Maybe<Scalars['BigInt']>
  rationale?: Maybe<Scalars['String']>
}

export type TerminatedWorkerEventEdge = {
  __typename?: 'TerminatedWorkerEventEdge'
  node: TerminatedWorkerEvent
  cursor: Scalars['String']
}

export enum TerminatedWorkerEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  PenaltyAsc = 'penalty_ASC',
  PenaltyDesc = 'penalty_DESC',
  RationaleAsc = 'rationale_ASC',
  RationaleDesc = 'rationale_DESC',
}

export type TerminatedWorkerEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  penalty?: Maybe<Scalars['BigInt']>
  rationale?: Maybe<Scalars['String']>
}

export type TerminatedWorkerEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  penalty_eq?: Maybe<Scalars['BigInt']>
  penalty_gt?: Maybe<Scalars['BigInt']>
  penalty_gte?: Maybe<Scalars['BigInt']>
  penalty_lt?: Maybe<Scalars['BigInt']>
  penalty_lte?: Maybe<Scalars['BigInt']>
  penalty_in?: Maybe<Array<Scalars['BigInt']>>
  rationale_eq?: Maybe<Scalars['String']>
  rationale_contains?: Maybe<Scalars['String']>
  rationale_startsWith?: Maybe<Scalars['String']>
  rationale_endsWith?: Maybe<Scalars['String']>
  rationale_in?: Maybe<Array<Scalars['String']>>
}

export type TerminatedWorkerEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type Worker = BaseGraphQlObject & {
  __typename?: 'Worker'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** WorkerId in specific working group module */
  runtimeId: Scalars['Int']
  group: WorkingGroup
  groupId: Scalars['String']
  membership: Membership
  membershipId: Scalars['String']
  /** Worker's role account */
  roleAccount: Scalars['String']
  /** Worker's reward account */
  rewardAccount: Scalars['String']
  /** Worker's staking account */
  stakeAccount: Scalars['String']
  /** Current worker status */
  status: WorkerStatus
  /** Whether the worker is also the working group lead */
  isLead: Scalars['Boolean']
  /** Current role stake (in JOY) */
  stake: Scalars['BigInt']
  payouts: Array<RewardPaidEvent>
  /** Blocknumber of the block the worker was hired at */
  hiredAtBlock: Scalars['Int']
  /** Time the worker was hired at */
  hiredAtTime: Scalars['DateTime']
  entry: OpeningFilledEvent
  entryId: Scalars['String']
  application: WorkingGroupApplication
  applicationId: Scalars['String']
  /** Worker's storage data */
  storage?: Maybe<Scalars['String']>
  leaderseteventworker?: Maybe<Array<LeaderSetEvent>>
  memberverificationstatusupdatedeventworker?: Maybe<Array<MemberVerificationStatusUpdatedEvent>>
  stakedecreasedeventworker?: Maybe<Array<StakeDecreasedEvent>>
  stakeincreasedeventworker?: Maybe<Array<StakeIncreasedEvent>>
  stakeslashedeventworker?: Maybe<Array<StakeSlashedEvent>>
  terminatedleadereventworker?: Maybe<Array<TerminatedLeaderEvent>>
  terminatedworkereventworker?: Maybe<Array<TerminatedWorkerEvent>>
  workerexitedeventworker?: Maybe<Array<WorkerExitedEvent>>
  workerrewardaccountupdatedeventworker?: Maybe<Array<WorkerRewardAccountUpdatedEvent>>
  workerrewardamountupdatedeventworker?: Maybe<Array<WorkerRewardAmountUpdatedEvent>>
  workerroleaccountupdatedeventworker?: Maybe<Array<WorkerRoleAccountUpdatedEvent>>
  workerstartedleavingeventworker?: Maybe<Array<WorkerStartedLeavingEvent>>
  workinggroupleader?: Maybe<Array<WorkingGroup>>
}

export type WorkerConnection = {
  __typename?: 'WorkerConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkerEdge>
  pageInfo: PageInfo
}

export type WorkerCreateInput = {
  runtimeId: Scalars['Float']
  groupId: Scalars['ID']
  membershipId: Scalars['ID']
  roleAccount: Scalars['String']
  rewardAccount: Scalars['String']
  stakeAccount: Scalars['String']
  status: Scalars['JSONObject']
  isLead: Scalars['Boolean']
  stake: Scalars['BigInt']
  hiredAtBlock: Scalars['Float']
  hiredAtTime: Scalars['DateTime']
  entryId: Scalars['ID']
  applicationId: Scalars['ID']
  storage?: Maybe<Scalars['String']>
}

export type WorkerEdge = {
  __typename?: 'WorkerEdge'
  node: Worker
  cursor: Scalars['String']
}

export type WorkerExitedEvent = BaseGraphQlObject & {
  __typename?: 'WorkerExitedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
}

export type WorkerExitedEventConnection = {
  __typename?: 'WorkerExitedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkerExitedEventEdge>
  pageInfo: PageInfo
}

export type WorkerExitedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
}

export type WorkerExitedEventEdge = {
  __typename?: 'WorkerExitedEventEdge'
  node: WorkerExitedEvent
  cursor: Scalars['String']
}

export enum WorkerExitedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
}

export type WorkerExitedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
}

export type WorkerExitedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
}

export type WorkerExitedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export enum WorkerOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  RuntimeIdAsc = 'runtimeId_ASC',
  RuntimeIdDesc = 'runtimeId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  MembershipIdAsc = 'membershipId_ASC',
  MembershipIdDesc = 'membershipId_DESC',
  RoleAccountAsc = 'roleAccount_ASC',
  RoleAccountDesc = 'roleAccount_DESC',
  RewardAccountAsc = 'rewardAccount_ASC',
  RewardAccountDesc = 'rewardAccount_DESC',
  StakeAccountAsc = 'stakeAccount_ASC',
  StakeAccountDesc = 'stakeAccount_DESC',
  IsLeadAsc = 'isLead_ASC',
  IsLeadDesc = 'isLead_DESC',
  StakeAsc = 'stake_ASC',
  StakeDesc = 'stake_DESC',
  HiredAtBlockAsc = 'hiredAtBlock_ASC',
  HiredAtBlockDesc = 'hiredAtBlock_DESC',
  HiredAtTimeAsc = 'hiredAtTime_ASC',
  HiredAtTimeDesc = 'hiredAtTime_DESC',
  EntryIdAsc = 'entryId_ASC',
  EntryIdDesc = 'entryId_DESC',
  ApplicationIdAsc = 'applicationId_ASC',
  ApplicationIdDesc = 'applicationId_DESC',
  StorageAsc = 'storage_ASC',
  StorageDesc = 'storage_DESC',
}

export type WorkerRewardAccountUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'WorkerRewardAccountUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** New reward account */
  newRewardAccount: Scalars['String']
}

export type WorkerRewardAccountUpdatedEventConnection = {
  __typename?: 'WorkerRewardAccountUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkerRewardAccountUpdatedEventEdge>
  pageInfo: PageInfo
}

export type WorkerRewardAccountUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  newRewardAccount: Scalars['String']
}

export type WorkerRewardAccountUpdatedEventEdge = {
  __typename?: 'WorkerRewardAccountUpdatedEventEdge'
  node: WorkerRewardAccountUpdatedEvent
  cursor: Scalars['String']
}

export enum WorkerRewardAccountUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  NewRewardAccountAsc = 'newRewardAccount_ASC',
  NewRewardAccountDesc = 'newRewardAccount_DESC',
}

export type WorkerRewardAccountUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  newRewardAccount?: Maybe<Scalars['String']>
}

export type WorkerRewardAccountUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  newRewardAccount_eq?: Maybe<Scalars['String']>
  newRewardAccount_contains?: Maybe<Scalars['String']>
  newRewardAccount_startsWith?: Maybe<Scalars['String']>
  newRewardAccount_endsWith?: Maybe<Scalars['String']>
  newRewardAccount_in?: Maybe<Array<Scalars['String']>>
}

export type WorkerRewardAccountUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkerRewardAmountUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'WorkerRewardAmountUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** New worker reward per block */
  newRewardPerBlock: Scalars['BigInt']
}

export type WorkerRewardAmountUpdatedEventConnection = {
  __typename?: 'WorkerRewardAmountUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkerRewardAmountUpdatedEventEdge>
  pageInfo: PageInfo
}

export type WorkerRewardAmountUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  newRewardPerBlock: Scalars['BigInt']
}

export type WorkerRewardAmountUpdatedEventEdge = {
  __typename?: 'WorkerRewardAmountUpdatedEventEdge'
  node: WorkerRewardAmountUpdatedEvent
  cursor: Scalars['String']
}

export enum WorkerRewardAmountUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  NewRewardPerBlockAsc = 'newRewardPerBlock_ASC',
  NewRewardPerBlockDesc = 'newRewardPerBlock_DESC',
}

export type WorkerRewardAmountUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  newRewardPerBlock?: Maybe<Scalars['BigInt']>
}

export type WorkerRewardAmountUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  newRewardPerBlock_eq?: Maybe<Scalars['BigInt']>
  newRewardPerBlock_gt?: Maybe<Scalars['BigInt']>
  newRewardPerBlock_gte?: Maybe<Scalars['BigInt']>
  newRewardPerBlock_lt?: Maybe<Scalars['BigInt']>
  newRewardPerBlock_lte?: Maybe<Scalars['BigInt']>
  newRewardPerBlock_in?: Maybe<Array<Scalars['BigInt']>>
}

export type WorkerRewardAmountUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkerRoleAccountUpdatedEvent = BaseGraphQlObject & {
  __typename?: 'WorkerRoleAccountUpdatedEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** New role account */
  newRoleAccount: Scalars['String']
}

export type WorkerRoleAccountUpdatedEventConnection = {
  __typename?: 'WorkerRoleAccountUpdatedEventConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkerRoleAccountUpdatedEventEdge>
  pageInfo: PageInfo
}

export type WorkerRoleAccountUpdatedEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  newRoleAccount: Scalars['String']
}

export type WorkerRoleAccountUpdatedEventEdge = {
  __typename?: 'WorkerRoleAccountUpdatedEventEdge'
  node: WorkerRoleAccountUpdatedEvent
  cursor: Scalars['String']
}

export enum WorkerRoleAccountUpdatedEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  NewRoleAccountAsc = 'newRoleAccount_ASC',
  NewRoleAccountDesc = 'newRoleAccount_DESC',
}

export type WorkerRoleAccountUpdatedEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  newRoleAccount?: Maybe<Scalars['String']>
}

export type WorkerRoleAccountUpdatedEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  newRoleAccount_eq?: Maybe<Scalars['String']>
  newRoleAccount_contains?: Maybe<Scalars['String']>
  newRoleAccount_startsWith?: Maybe<Scalars['String']>
  newRoleAccount_endsWith?: Maybe<Scalars['String']>
  newRoleAccount_in?: Maybe<Array<Scalars['String']>>
}

export type WorkerRoleAccountUpdatedEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkerStartedLeavingEvent = BaseGraphQlObject & {
  __typename?: 'WorkerStartedLeavingEvent'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  event: Event
  eventId: Scalars['String']
  group: WorkingGroup
  groupId: Scalars['String']
  worker: Worker
  workerId: Scalars['String']
  /** Optional rationale */
  rationale?: Maybe<Scalars['String']>
}

export type WorkerStartedLeavingEventConnection = {
  __typename?: 'WorkerStartedLeavingEventConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkerStartedLeavingEventEdge>
  pageInfo: PageInfo
}

export type WorkerStartedLeavingEventCreateInput = {
  eventId: Scalars['ID']
  groupId: Scalars['ID']
  workerId: Scalars['ID']
  rationale?: Maybe<Scalars['String']>
}

export type WorkerStartedLeavingEventEdge = {
  __typename?: 'WorkerStartedLeavingEventEdge'
  node: WorkerStartedLeavingEvent
  cursor: Scalars['String']
}

export enum WorkerStartedLeavingEventOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  EventIdAsc = 'eventId_ASC',
  EventIdDesc = 'eventId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  WorkerIdAsc = 'workerId_ASC',
  WorkerIdDesc = 'workerId_DESC',
  RationaleAsc = 'rationale_ASC',
  RationaleDesc = 'rationale_DESC',
}

export type WorkerStartedLeavingEventUpdateInput = {
  eventId?: Maybe<Scalars['ID']>
  groupId?: Maybe<Scalars['ID']>
  workerId?: Maybe<Scalars['ID']>
  rationale?: Maybe<Scalars['String']>
}

export type WorkerStartedLeavingEventWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  eventId_eq?: Maybe<Scalars['ID']>
  eventId_in?: Maybe<Array<Scalars['ID']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  workerId_eq?: Maybe<Scalars['ID']>
  workerId_in?: Maybe<Array<Scalars['ID']>>
  rationale_eq?: Maybe<Scalars['String']>
  rationale_contains?: Maybe<Scalars['String']>
  rationale_startsWith?: Maybe<Scalars['String']>
  rationale_endsWith?: Maybe<Scalars['String']>
  rationale_in?: Maybe<Array<Scalars['String']>>
}

export type WorkerStartedLeavingEventWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkerStatus = WorkerStatusActive | WorkerStatusLeft | WorkerStatusTerminated

export type WorkerStatusActive = {
  __typename?: 'WorkerStatusActive'
  phantom?: Maybe<Scalars['Int']>
}

export type WorkerStatusActiveCreateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type WorkerStatusActiveUpdateInput = {
  phantom?: Maybe<Scalars['Float']>
}

export type WorkerStatusActiveWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  phantom_eq?: Maybe<Scalars['Int']>
  phantom_gt?: Maybe<Scalars['Int']>
  phantom_gte?: Maybe<Scalars['Int']>
  phantom_lt?: Maybe<Scalars['Int']>
  phantom_lte?: Maybe<Scalars['Int']>
  phantom_in?: Maybe<Array<Scalars['Int']>>
}

export type WorkerStatusActiveWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkerStatusLeft = {
  __typename?: 'WorkerStatusLeft'
  workerStartedLeavingEventId: Scalars['String']
  workerExitedEventId?: Maybe<Scalars['String']>
}

export type WorkerStatusLeftCreateInput = {
  workerStartedLeavingEventId: Scalars['String']
  workerExitedEventId?: Maybe<Scalars['String']>
}

export type WorkerStatusLeftUpdateInput = {
  workerStartedLeavingEventId?: Maybe<Scalars['String']>
  workerExitedEventId?: Maybe<Scalars['String']>
}

export type WorkerStatusLeftWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  workerStartedLeavingEventId_eq?: Maybe<Scalars['String']>
  workerStartedLeavingEventId_contains?: Maybe<Scalars['String']>
  workerStartedLeavingEventId_startsWith?: Maybe<Scalars['String']>
  workerStartedLeavingEventId_endsWith?: Maybe<Scalars['String']>
  workerStartedLeavingEventId_in?: Maybe<Array<Scalars['String']>>
  workerExitedEventId_eq?: Maybe<Scalars['String']>
  workerExitedEventId_contains?: Maybe<Scalars['String']>
  workerExitedEventId_startsWith?: Maybe<Scalars['String']>
  workerExitedEventId_endsWith?: Maybe<Scalars['String']>
  workerExitedEventId_in?: Maybe<Array<Scalars['String']>>
}

export type WorkerStatusLeftWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkerStatusTerminated = {
  __typename?: 'WorkerStatusTerminated'
  terminatedWorkerEventId: Scalars['String']
  workerExitedEventId?: Maybe<Scalars['String']>
}

export type WorkerStatusTerminatedCreateInput = {
  terminatedWorkerEventId: Scalars['String']
  workerExitedEventId?: Maybe<Scalars['String']>
}

export type WorkerStatusTerminatedUpdateInput = {
  terminatedWorkerEventId?: Maybe<Scalars['String']>
  workerExitedEventId?: Maybe<Scalars['String']>
}

export type WorkerStatusTerminatedWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  terminatedWorkerEventId_eq?: Maybe<Scalars['String']>
  terminatedWorkerEventId_contains?: Maybe<Scalars['String']>
  terminatedWorkerEventId_startsWith?: Maybe<Scalars['String']>
  terminatedWorkerEventId_endsWith?: Maybe<Scalars['String']>
  terminatedWorkerEventId_in?: Maybe<Array<Scalars['String']>>
  workerExitedEventId_eq?: Maybe<Scalars['String']>
  workerExitedEventId_contains?: Maybe<Scalars['String']>
  workerExitedEventId_startsWith?: Maybe<Scalars['String']>
  workerExitedEventId_endsWith?: Maybe<Scalars['String']>
  workerExitedEventId_in?: Maybe<Array<Scalars['String']>>
}

export type WorkerStatusTerminatedWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkerUpdateInput = {
  runtimeId?: Maybe<Scalars['Float']>
  groupId?: Maybe<Scalars['ID']>
  membershipId?: Maybe<Scalars['ID']>
  roleAccount?: Maybe<Scalars['String']>
  rewardAccount?: Maybe<Scalars['String']>
  stakeAccount?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['JSONObject']>
  isLead?: Maybe<Scalars['Boolean']>
  stake?: Maybe<Scalars['BigInt']>
  hiredAtBlock?: Maybe<Scalars['Float']>
  hiredAtTime?: Maybe<Scalars['DateTime']>
  entryId?: Maybe<Scalars['ID']>
  applicationId?: Maybe<Scalars['ID']>
  storage?: Maybe<Scalars['String']>
}

export type WorkerWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  runtimeId_eq?: Maybe<Scalars['Int']>
  runtimeId_gt?: Maybe<Scalars['Int']>
  runtimeId_gte?: Maybe<Scalars['Int']>
  runtimeId_lt?: Maybe<Scalars['Int']>
  runtimeId_lte?: Maybe<Scalars['Int']>
  runtimeId_in?: Maybe<Array<Scalars['Int']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  membershipId_eq?: Maybe<Scalars['ID']>
  membershipId_in?: Maybe<Array<Scalars['ID']>>
  roleAccount_eq?: Maybe<Scalars['String']>
  roleAccount_contains?: Maybe<Scalars['String']>
  roleAccount_startsWith?: Maybe<Scalars['String']>
  roleAccount_endsWith?: Maybe<Scalars['String']>
  roleAccount_in?: Maybe<Array<Scalars['String']>>
  rewardAccount_eq?: Maybe<Scalars['String']>
  rewardAccount_contains?: Maybe<Scalars['String']>
  rewardAccount_startsWith?: Maybe<Scalars['String']>
  rewardAccount_endsWith?: Maybe<Scalars['String']>
  rewardAccount_in?: Maybe<Array<Scalars['String']>>
  stakeAccount_eq?: Maybe<Scalars['String']>
  stakeAccount_contains?: Maybe<Scalars['String']>
  stakeAccount_startsWith?: Maybe<Scalars['String']>
  stakeAccount_endsWith?: Maybe<Scalars['String']>
  stakeAccount_in?: Maybe<Array<Scalars['String']>>
  status_json?: Maybe<Scalars['JSONObject']>
  isLead_eq?: Maybe<Scalars['Boolean']>
  isLead_in?: Maybe<Array<Scalars['Boolean']>>
  stake_eq?: Maybe<Scalars['BigInt']>
  stake_gt?: Maybe<Scalars['BigInt']>
  stake_gte?: Maybe<Scalars['BigInt']>
  stake_lt?: Maybe<Scalars['BigInt']>
  stake_lte?: Maybe<Scalars['BigInt']>
  stake_in?: Maybe<Array<Scalars['BigInt']>>
  hiredAtBlock_eq?: Maybe<Scalars['Int']>
  hiredAtBlock_gt?: Maybe<Scalars['Int']>
  hiredAtBlock_gte?: Maybe<Scalars['Int']>
  hiredAtBlock_lt?: Maybe<Scalars['Int']>
  hiredAtBlock_lte?: Maybe<Scalars['Int']>
  hiredAtBlock_in?: Maybe<Array<Scalars['Int']>>
  hiredAtTime_eq?: Maybe<Scalars['DateTime']>
  hiredAtTime_lt?: Maybe<Scalars['DateTime']>
  hiredAtTime_lte?: Maybe<Scalars['DateTime']>
  hiredAtTime_gt?: Maybe<Scalars['DateTime']>
  hiredAtTime_gte?: Maybe<Scalars['DateTime']>
  entryId_eq?: Maybe<Scalars['ID']>
  entryId_in?: Maybe<Array<Scalars['ID']>>
  applicationId_eq?: Maybe<Scalars['ID']>
  applicationId_in?: Maybe<Array<Scalars['ID']>>
  storage_eq?: Maybe<Scalars['String']>
  storage_contains?: Maybe<Scalars['String']>
  storage_startsWith?: Maybe<Scalars['String']>
  storage_endsWith?: Maybe<Scalars['String']>
  storage_in?: Maybe<Array<Scalars['String']>>
}

export type WorkerWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkingGroup = BaseGraphQlObject & {
  __typename?: 'WorkingGroup'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Working group name */
  name: Scalars['String']
  status?: Maybe<WorkingGroupMetadata>
  statusId?: Maybe<Scalars['String']>
  leader?: Maybe<Worker>
  leaderId?: Maybe<Scalars['String']>
  workers: Array<Worker>
  openings: Array<WorkingGroupOpening>
  /** Current working group budget (JOY) */
  budget: Scalars['BigInt']
  applicationwithdrawneventgroup?: Maybe<Array<ApplicationWithdrawnEvent>>
  appliedonopeningeventgroup?: Maybe<Array<AppliedOnOpeningEvent>>
  budgetseteventgroup?: Maybe<Array<BudgetSetEvent>>
  budgetspendingeventgroup?: Maybe<Array<BudgetSpendingEvent>>
  leaderseteventgroup?: Maybe<Array<LeaderSetEvent>>
  leaderunseteventgroup?: Maybe<Array<LeaderUnsetEvent>>
  openingaddedeventgroup?: Maybe<Array<OpeningAddedEvent>>
  openingcanceledeventgroup?: Maybe<Array<OpeningCanceledEvent>>
  openingfilledeventgroup?: Maybe<Array<OpeningFilledEvent>>
  rewardpaideventgroup?: Maybe<Array<RewardPaidEvent>>
  stakedecreasedeventgroup?: Maybe<Array<StakeDecreasedEvent>>
  stakeincreasedeventgroup?: Maybe<Array<StakeIncreasedEvent>>
  stakeslashedeventgroup?: Maybe<Array<StakeSlashedEvent>>
  statustextchangedeventgroup?: Maybe<Array<StatusTextChangedEvent>>
  terminatedleadereventgroup?: Maybe<Array<TerminatedLeaderEvent>>
  terminatedworkereventgroup?: Maybe<Array<TerminatedWorkerEvent>>
  workerexitedeventgroup?: Maybe<Array<WorkerExitedEvent>>
  workerrewardaccountupdatedeventgroup?: Maybe<Array<WorkerRewardAccountUpdatedEvent>>
  workerrewardamountupdatedeventgroup?: Maybe<Array<WorkerRewardAmountUpdatedEvent>>
  workerroleaccountupdatedeventgroup?: Maybe<Array<WorkerRoleAccountUpdatedEvent>>
  workerstartedleavingeventgroup?: Maybe<Array<WorkerStartedLeavingEvent>>
}

export type WorkingGroupApplication = BaseGraphQlObject & {
  __typename?: 'WorkingGroupApplication'
  id: Scalars['ID']
  /** Time of application creation */
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** ApplicationId in specific working group module */
  runtimeId: Scalars['Int']
  opening: WorkingGroupOpening
  openingId: Scalars['String']
  applicant: Membership
  applicantId: Scalars['String']
  /** Application stake */
  stake: Scalars['BigInt']
  /** Applicant's initial role account */
  roleAccount: Scalars['String']
  /** Applicant's initial reward account */
  rewardAccount: Scalars['String']
  /** Applicant's initial staking account */
  stakingAccount: Scalars['String']
  answers: Array<ApplicationFormQuestionAnswer>
  /** Current application status */
  status: WorkingGroupApplicationStatus
  /** Blocknumber of application creation block */
  createdAtBlock: Scalars['Int']
  applicationwithdrawneventapplication?: Maybe<Array<ApplicationWithdrawnEvent>>
  appliedonopeningeventapplication?: Maybe<Array<AppliedOnOpeningEvent>>
  workerapplication?: Maybe<Array<Worker>>
}

export type WorkingGroupApplicationConnection = {
  __typename?: 'WorkingGroupApplicationConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkingGroupApplicationEdge>
  pageInfo: PageInfo
}

export type WorkingGroupApplicationCreateInput = {
  createdAt: Scalars['DateTime']
  runtimeId: Scalars['Float']
  openingId: Scalars['ID']
  applicantId: Scalars['ID']
  stake: Scalars['BigInt']
  roleAccount: Scalars['String']
  rewardAccount: Scalars['String']
  stakingAccount: Scalars['String']
  status: Scalars['JSONObject']
  createdAtBlock: Scalars['Float']
}

export type WorkingGroupApplicationEdge = {
  __typename?: 'WorkingGroupApplicationEdge'
  node: WorkingGroupApplication
  cursor: Scalars['String']
}

export enum WorkingGroupApplicationOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  RuntimeIdAsc = 'runtimeId_ASC',
  RuntimeIdDesc = 'runtimeId_DESC',
  OpeningIdAsc = 'openingId_ASC',
  OpeningIdDesc = 'openingId_DESC',
  ApplicantIdAsc = 'applicantId_ASC',
  ApplicantIdDesc = 'applicantId_DESC',
  StakeAsc = 'stake_ASC',
  StakeDesc = 'stake_DESC',
  RoleAccountAsc = 'roleAccount_ASC',
  RoleAccountDesc = 'roleAccount_DESC',
  RewardAccountAsc = 'rewardAccount_ASC',
  RewardAccountDesc = 'rewardAccount_DESC',
  StakingAccountAsc = 'stakingAccount_ASC',
  StakingAccountDesc = 'stakingAccount_DESC',
  CreatedAtBlockAsc = 'createdAtBlock_ASC',
  CreatedAtBlockDesc = 'createdAtBlock_DESC',
}

export type WorkingGroupApplicationStatus =
  | ApplicationStatusPending
  | ApplicationStatusAccepted
  | ApplicationStatusRejected
  | ApplicationStatusWithdrawn
  | ApplicationStatusCancelled

export type WorkingGroupApplicationUpdateInput = {
  createdAt?: Maybe<Scalars['DateTime']>
  runtimeId?: Maybe<Scalars['Float']>
  openingId?: Maybe<Scalars['ID']>
  applicantId?: Maybe<Scalars['ID']>
  stake?: Maybe<Scalars['BigInt']>
  roleAccount?: Maybe<Scalars['String']>
  rewardAccount?: Maybe<Scalars['String']>
  stakingAccount?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['JSONObject']>
  createdAtBlock?: Maybe<Scalars['Float']>
}

export type WorkingGroupApplicationWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  runtimeId_eq?: Maybe<Scalars['Int']>
  runtimeId_gt?: Maybe<Scalars['Int']>
  runtimeId_gte?: Maybe<Scalars['Int']>
  runtimeId_lt?: Maybe<Scalars['Int']>
  runtimeId_lte?: Maybe<Scalars['Int']>
  runtimeId_in?: Maybe<Array<Scalars['Int']>>
  openingId_eq?: Maybe<Scalars['ID']>
  openingId_in?: Maybe<Array<Scalars['ID']>>
  applicantId_eq?: Maybe<Scalars['ID']>
  applicantId_in?: Maybe<Array<Scalars['ID']>>
  stake_eq?: Maybe<Scalars['BigInt']>
  stake_gt?: Maybe<Scalars['BigInt']>
  stake_gte?: Maybe<Scalars['BigInt']>
  stake_lt?: Maybe<Scalars['BigInt']>
  stake_lte?: Maybe<Scalars['BigInt']>
  stake_in?: Maybe<Array<Scalars['BigInt']>>
  roleAccount_eq?: Maybe<Scalars['String']>
  roleAccount_contains?: Maybe<Scalars['String']>
  roleAccount_startsWith?: Maybe<Scalars['String']>
  roleAccount_endsWith?: Maybe<Scalars['String']>
  roleAccount_in?: Maybe<Array<Scalars['String']>>
  rewardAccount_eq?: Maybe<Scalars['String']>
  rewardAccount_contains?: Maybe<Scalars['String']>
  rewardAccount_startsWith?: Maybe<Scalars['String']>
  rewardAccount_endsWith?: Maybe<Scalars['String']>
  rewardAccount_in?: Maybe<Array<Scalars['String']>>
  stakingAccount_eq?: Maybe<Scalars['String']>
  stakingAccount_contains?: Maybe<Scalars['String']>
  stakingAccount_startsWith?: Maybe<Scalars['String']>
  stakingAccount_endsWith?: Maybe<Scalars['String']>
  stakingAccount_in?: Maybe<Array<Scalars['String']>>
  status_json?: Maybe<Scalars['JSONObject']>
  createdAtBlock_eq?: Maybe<Scalars['Int']>
  createdAtBlock_gt?: Maybe<Scalars['Int']>
  createdAtBlock_gte?: Maybe<Scalars['Int']>
  createdAtBlock_lt?: Maybe<Scalars['Int']>
  createdAtBlock_lte?: Maybe<Scalars['Int']>
  createdAtBlock_in?: Maybe<Array<Scalars['Int']>>
}

export type WorkingGroupApplicationWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkingGroupConnection = {
  __typename?: 'WorkingGroupConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkingGroupEdge>
  pageInfo: PageInfo
}

export type WorkingGroupCreateInput = {
  name: Scalars['String']
  statusId?: Maybe<Scalars['ID']>
  leaderId?: Maybe<Scalars['ID']>
  budget: Scalars['BigInt']
}

export type WorkingGroupEdge = {
  __typename?: 'WorkingGroupEdge'
  node: WorkingGroup
  cursor: Scalars['String']
}

export type WorkingGroupMetadata = BaseGraphQlObject & {
  __typename?: 'WorkingGroupMetadata'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Status name */
  name: Scalars['String']
  /** Status message */
  message?: Maybe<Scalars['String']>
  /** Working group about text */
  about?: Maybe<Scalars['String']>
  /** Working group description text */
  description?: Maybe<Scalars['String']>
  /** Blocknumber of the block at which status was set */
  setAtBlock: Scalars['Int']
  /** The time at which status was set */
  setAtTime: Scalars['DateTime']
  statustextchangedeventmetadata?: Maybe<Array<StatusTextChangedEvent>>
  workinggroupstatus?: Maybe<Array<WorkingGroup>>
}

export type WorkingGroupMetadataConnection = {
  __typename?: 'WorkingGroupMetadataConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkingGroupMetadataEdge>
  pageInfo: PageInfo
}

export type WorkingGroupMetadataCreateInput = {
  name: Scalars['String']
  message?: Maybe<Scalars['String']>
  about?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  setAtBlock: Scalars['Float']
  setAtTime: Scalars['DateTime']
}

export type WorkingGroupMetadataEdge = {
  __typename?: 'WorkingGroupMetadataEdge'
  node: WorkingGroupMetadata
  cursor: Scalars['String']
}

export enum WorkingGroupMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  MessageAsc = 'message_ASC',
  MessageDesc = 'message_DESC',
  AboutAsc = 'about_ASC',
  AboutDesc = 'about_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  SetAtBlockAsc = 'setAtBlock_ASC',
  SetAtBlockDesc = 'setAtBlock_DESC',
  SetAtTimeAsc = 'setAtTime_ASC',
  SetAtTimeDesc = 'setAtTime_DESC',
}

export type WorkingGroupMetadataUpdateInput = {
  name?: Maybe<Scalars['String']>
  message?: Maybe<Scalars['String']>
  about?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  setAtBlock?: Maybe<Scalars['Float']>
  setAtTime?: Maybe<Scalars['DateTime']>
}

export type WorkingGroupMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  name_eq?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_startsWith?: Maybe<Scalars['String']>
  name_endsWith?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  message_eq?: Maybe<Scalars['String']>
  message_contains?: Maybe<Scalars['String']>
  message_startsWith?: Maybe<Scalars['String']>
  message_endsWith?: Maybe<Scalars['String']>
  message_in?: Maybe<Array<Scalars['String']>>
  about_eq?: Maybe<Scalars['String']>
  about_contains?: Maybe<Scalars['String']>
  about_startsWith?: Maybe<Scalars['String']>
  about_endsWith?: Maybe<Scalars['String']>
  about_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  setAtBlock_eq?: Maybe<Scalars['Int']>
  setAtBlock_gt?: Maybe<Scalars['Int']>
  setAtBlock_gte?: Maybe<Scalars['Int']>
  setAtBlock_lt?: Maybe<Scalars['Int']>
  setAtBlock_lte?: Maybe<Scalars['Int']>
  setAtBlock_in?: Maybe<Array<Scalars['Int']>>
  setAtTime_eq?: Maybe<Scalars['DateTime']>
  setAtTime_lt?: Maybe<Scalars['DateTime']>
  setAtTime_lte?: Maybe<Scalars['DateTime']>
  setAtTime_gt?: Maybe<Scalars['DateTime']>
  setAtTime_gte?: Maybe<Scalars['DateTime']>
}

export type WorkingGroupMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export type WorkingGroupOpening = BaseGraphQlObject & {
  __typename?: 'WorkingGroupOpening'
  id: Scalars['ID']
  /** Time of opening creation */
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** OpeningId in specific working group module */
  runtimeId: Scalars['Int']
  group: WorkingGroup
  groupId: Scalars['String']
  applications: Array<WorkingGroupApplication>
  /** Type of the opening (Leader/Regular) */
  type: WorkingGroupOpeningType
  /** Current opening status */
  status: WorkingGroupOpeningStatus
  metadata: WorkingGroupOpeningMetadata
  metadataId: Scalars['String']
  /** Role stake amount */
  stakeAmount: Scalars['BigInt']
  /** Role stake unstaking period in blocks */
  unstakingPeriod: Scalars['Int']
  /** Initial workers' reward per block */
  rewardPerBlock: Scalars['BigInt']
  /** Blocknumber of opening creation block */
  createdAtBlock: Scalars['Int']
  appliedonopeningeventopening?: Maybe<Array<AppliedOnOpeningEvent>>
  openingaddedeventopening?: Maybe<Array<OpeningAddedEvent>>
  openingcanceledeventopening?: Maybe<Array<OpeningCanceledEvent>>
  openingfilledeventopening?: Maybe<Array<OpeningFilledEvent>>
}

export type WorkingGroupOpeningConnection = {
  __typename?: 'WorkingGroupOpeningConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkingGroupOpeningEdge>
  pageInfo: PageInfo
}

export type WorkingGroupOpeningCreateInput = {
  createdAt: Scalars['DateTime']
  runtimeId: Scalars['Float']
  groupId: Scalars['ID']
  type: WorkingGroupOpeningType
  status: Scalars['JSONObject']
  metadataId: Scalars['ID']
  stakeAmount: Scalars['BigInt']
  unstakingPeriod: Scalars['Float']
  rewardPerBlock: Scalars['BigInt']
  createdAtBlock: Scalars['Float']
}

export type WorkingGroupOpeningEdge = {
  __typename?: 'WorkingGroupOpeningEdge'
  node: WorkingGroupOpening
  cursor: Scalars['String']
}

export type WorkingGroupOpeningMetadata = BaseGraphQlObject & {
  __typename?: 'WorkingGroupOpeningMetadata'
  id: Scalars['ID']
  createdAt: Scalars['DateTime']
  createdById: Scalars['String']
  updatedAt?: Maybe<Scalars['DateTime']>
  updatedById?: Maybe<Scalars['String']>
  deletedAt?: Maybe<Scalars['DateTime']>
  deletedById?: Maybe<Scalars['String']>
  version: Scalars['Int']
  /** Opening short description */
  shortDescription: Scalars['String']
  /** Opening description (md-formatted) */
  description: Scalars['String']
  /** Expected max. number of applicants that will be hired */
  hiringLimit: Scalars['Int']
  /** Expected time when the opening will close */
  expectedEnding: Scalars['DateTime']
  /** Md-formatted text explaining the application process */
  applicationDetails: Scalars['String']
  applicationFormQuestions: Array<ApplicationFormQuestion>
  workinggroupopeningmetadata?: Maybe<Array<WorkingGroupOpening>>
}

export type WorkingGroupOpeningMetadataConnection = {
  __typename?: 'WorkingGroupOpeningMetadataConnection'
  totalCount: Scalars['Int']
  edges: Array<WorkingGroupOpeningMetadataEdge>
  pageInfo: PageInfo
}

export type WorkingGroupOpeningMetadataCreateInput = {
  shortDescription: Scalars['String']
  description: Scalars['String']
  hiringLimit: Scalars['Float']
  expectedEnding: Scalars['DateTime']
  applicationDetails: Scalars['String']
}

export type WorkingGroupOpeningMetadataEdge = {
  __typename?: 'WorkingGroupOpeningMetadataEdge'
  node: WorkingGroupOpeningMetadata
  cursor: Scalars['String']
}

export enum WorkingGroupOpeningMetadataOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  ShortDescriptionAsc = 'shortDescription_ASC',
  ShortDescriptionDesc = 'shortDescription_DESC',
  DescriptionAsc = 'description_ASC',
  DescriptionDesc = 'description_DESC',
  HiringLimitAsc = 'hiringLimit_ASC',
  HiringLimitDesc = 'hiringLimit_DESC',
  ExpectedEndingAsc = 'expectedEnding_ASC',
  ExpectedEndingDesc = 'expectedEnding_DESC',
  ApplicationDetailsAsc = 'applicationDetails_ASC',
  ApplicationDetailsDesc = 'applicationDetails_DESC',
}

export type WorkingGroupOpeningMetadataUpdateInput = {
  shortDescription?: Maybe<Scalars['String']>
  description?: Maybe<Scalars['String']>
  hiringLimit?: Maybe<Scalars['Float']>
  expectedEnding?: Maybe<Scalars['DateTime']>
  applicationDetails?: Maybe<Scalars['String']>
}

export type WorkingGroupOpeningMetadataWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  shortDescription_eq?: Maybe<Scalars['String']>
  shortDescription_contains?: Maybe<Scalars['String']>
  shortDescription_startsWith?: Maybe<Scalars['String']>
  shortDescription_endsWith?: Maybe<Scalars['String']>
  shortDescription_in?: Maybe<Array<Scalars['String']>>
  description_eq?: Maybe<Scalars['String']>
  description_contains?: Maybe<Scalars['String']>
  description_startsWith?: Maybe<Scalars['String']>
  description_endsWith?: Maybe<Scalars['String']>
  description_in?: Maybe<Array<Scalars['String']>>
  hiringLimit_eq?: Maybe<Scalars['Int']>
  hiringLimit_gt?: Maybe<Scalars['Int']>
  hiringLimit_gte?: Maybe<Scalars['Int']>
  hiringLimit_lt?: Maybe<Scalars['Int']>
  hiringLimit_lte?: Maybe<Scalars['Int']>
  hiringLimit_in?: Maybe<Array<Scalars['Int']>>
  expectedEnding_eq?: Maybe<Scalars['DateTime']>
  expectedEnding_lt?: Maybe<Scalars['DateTime']>
  expectedEnding_lte?: Maybe<Scalars['DateTime']>
  expectedEnding_gt?: Maybe<Scalars['DateTime']>
  expectedEnding_gte?: Maybe<Scalars['DateTime']>
  applicationDetails_eq?: Maybe<Scalars['String']>
  applicationDetails_contains?: Maybe<Scalars['String']>
  applicationDetails_startsWith?: Maybe<Scalars['String']>
  applicationDetails_endsWith?: Maybe<Scalars['String']>
  applicationDetails_in?: Maybe<Array<Scalars['String']>>
}

export type WorkingGroupOpeningMetadataWhereUniqueInput = {
  id: Scalars['ID']
}

export enum WorkingGroupOpeningOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  RuntimeIdAsc = 'runtimeId_ASC',
  RuntimeIdDesc = 'runtimeId_DESC',
  GroupIdAsc = 'groupId_ASC',
  GroupIdDesc = 'groupId_DESC',
  TypeAsc = 'type_ASC',
  TypeDesc = 'type_DESC',
  MetadataIdAsc = 'metadataId_ASC',
  MetadataIdDesc = 'metadataId_DESC',
  StakeAmountAsc = 'stakeAmount_ASC',
  StakeAmountDesc = 'stakeAmount_DESC',
  UnstakingPeriodAsc = 'unstakingPeriod_ASC',
  UnstakingPeriodDesc = 'unstakingPeriod_DESC',
  RewardPerBlockAsc = 'rewardPerBlock_ASC',
  RewardPerBlockDesc = 'rewardPerBlock_DESC',
  CreatedAtBlockAsc = 'createdAtBlock_ASC',
  CreatedAtBlockDesc = 'createdAtBlock_DESC',
}

export type WorkingGroupOpeningStatus = OpeningStatusOpen | OpeningStatusFilled | OpeningStatusCancelled

export enum WorkingGroupOpeningType {
  Regular = 'REGULAR',
  Leader = 'LEADER',
}

export type WorkingGroupOpeningUpdateInput = {
  createdAt?: Maybe<Scalars['DateTime']>
  runtimeId?: Maybe<Scalars['Float']>
  groupId?: Maybe<Scalars['ID']>
  type?: Maybe<WorkingGroupOpeningType>
  status?: Maybe<Scalars['JSONObject']>
  metadataId?: Maybe<Scalars['ID']>
  stakeAmount?: Maybe<Scalars['BigInt']>
  unstakingPeriod?: Maybe<Scalars['Float']>
  rewardPerBlock?: Maybe<Scalars['BigInt']>
  createdAtBlock?: Maybe<Scalars['Float']>
}

export type WorkingGroupOpeningWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  runtimeId_eq?: Maybe<Scalars['Int']>
  runtimeId_gt?: Maybe<Scalars['Int']>
  runtimeId_gte?: Maybe<Scalars['Int']>
  runtimeId_lt?: Maybe<Scalars['Int']>
  runtimeId_lte?: Maybe<Scalars['Int']>
  runtimeId_in?: Maybe<Array<Scalars['Int']>>
  groupId_eq?: Maybe<Scalars['ID']>
  groupId_in?: Maybe<Array<Scalars['ID']>>
  type_eq?: Maybe<WorkingGroupOpeningType>
  type_in?: Maybe<Array<WorkingGroupOpeningType>>
  status_json?: Maybe<Scalars['JSONObject']>
  metadataId_eq?: Maybe<Scalars['ID']>
  metadataId_in?: Maybe<Array<Scalars['ID']>>
  stakeAmount_eq?: Maybe<Scalars['BigInt']>
  stakeAmount_gt?: Maybe<Scalars['BigInt']>
  stakeAmount_gte?: Maybe<Scalars['BigInt']>
  stakeAmount_lt?: Maybe<Scalars['BigInt']>
  stakeAmount_lte?: Maybe<Scalars['BigInt']>
  stakeAmount_in?: Maybe<Array<Scalars['BigInt']>>
  unstakingPeriod_eq?: Maybe<Scalars['Int']>
  unstakingPeriod_gt?: Maybe<Scalars['Int']>
  unstakingPeriod_gte?: Maybe<Scalars['Int']>
  unstakingPeriod_lt?: Maybe<Scalars['Int']>
  unstakingPeriod_lte?: Maybe<Scalars['Int']>
  unstakingPeriod_in?: Maybe<Array<Scalars['Int']>>
  rewardPerBlock_eq?: Maybe<Scalars['BigInt']>
  rewardPerBlock_gt?: Maybe<Scalars['BigInt']>
  rewardPerBlock_gte?: Maybe<Scalars['BigInt']>
  rewardPerBlock_lt?: Maybe<Scalars['BigInt']>
  rewardPerBlock_lte?: Maybe<Scalars['BigInt']>
  rewardPerBlock_in?: Maybe<Array<Scalars['BigInt']>>
  createdAtBlock_eq?: Maybe<Scalars['Int']>
  createdAtBlock_gt?: Maybe<Scalars['Int']>
  createdAtBlock_gte?: Maybe<Scalars['Int']>
  createdAtBlock_lt?: Maybe<Scalars['Int']>
  createdAtBlock_lte?: Maybe<Scalars['Int']>
  createdAtBlock_in?: Maybe<Array<Scalars['Int']>>
}

export type WorkingGroupOpeningWhereUniqueInput = {
  id: Scalars['ID']
}

export enum WorkingGroupOrderByInput {
  CreatedAtAsc = 'createdAt_ASC',
  CreatedAtDesc = 'createdAt_DESC',
  UpdatedAtAsc = 'updatedAt_ASC',
  UpdatedAtDesc = 'updatedAt_DESC',
  DeletedAtAsc = 'deletedAt_ASC',
  DeletedAtDesc = 'deletedAt_DESC',
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC',
  StatusIdAsc = 'statusId_ASC',
  StatusIdDesc = 'statusId_DESC',
  LeaderIdAsc = 'leaderId_ASC',
  LeaderIdDesc = 'leaderId_DESC',
  BudgetAsc = 'budget_ASC',
  BudgetDesc = 'budget_DESC',
}

export type WorkingGroupUpdateInput = {
  name?: Maybe<Scalars['String']>
  statusId?: Maybe<Scalars['ID']>
  leaderId?: Maybe<Scalars['ID']>
  budget?: Maybe<Scalars['BigInt']>
}

export type WorkingGroupWhereInput = {
  id_eq?: Maybe<Scalars['ID']>
  id_in?: Maybe<Array<Scalars['ID']>>
  createdAt_eq?: Maybe<Scalars['DateTime']>
  createdAt_lt?: Maybe<Scalars['DateTime']>
  createdAt_lte?: Maybe<Scalars['DateTime']>
  createdAt_gt?: Maybe<Scalars['DateTime']>
  createdAt_gte?: Maybe<Scalars['DateTime']>
  createdById_eq?: Maybe<Scalars['ID']>
  createdById_in?: Maybe<Array<Scalars['ID']>>
  updatedAt_eq?: Maybe<Scalars['DateTime']>
  updatedAt_lt?: Maybe<Scalars['DateTime']>
  updatedAt_lte?: Maybe<Scalars['DateTime']>
  updatedAt_gt?: Maybe<Scalars['DateTime']>
  updatedAt_gte?: Maybe<Scalars['DateTime']>
  updatedById_eq?: Maybe<Scalars['ID']>
  updatedById_in?: Maybe<Array<Scalars['ID']>>
  deletedAt_all?: Maybe<Scalars['Boolean']>
  deletedAt_eq?: Maybe<Scalars['DateTime']>
  deletedAt_lt?: Maybe<Scalars['DateTime']>
  deletedAt_lte?: Maybe<Scalars['DateTime']>
  deletedAt_gt?: Maybe<Scalars['DateTime']>
  deletedAt_gte?: Maybe<Scalars['DateTime']>
  deletedById_eq?: Maybe<Scalars['ID']>
  deletedById_in?: Maybe<Array<Scalars['ID']>>
  name_eq?: Maybe<Scalars['String']>
  name_contains?: Maybe<Scalars['String']>
  name_startsWith?: Maybe<Scalars['String']>
  name_endsWith?: Maybe<Scalars['String']>
  name_in?: Maybe<Array<Scalars['String']>>
  statusId_eq?: Maybe<Scalars['ID']>
  statusId_in?: Maybe<Array<Scalars['ID']>>
  leaderId_eq?: Maybe<Scalars['ID']>
  leaderId_in?: Maybe<Array<Scalars['ID']>>
  budget_eq?: Maybe<Scalars['BigInt']>
  budget_gt?: Maybe<Scalars['BigInt']>
  budget_gte?: Maybe<Scalars['BigInt']>
  budget_lt?: Maybe<Scalars['BigInt']>
  budget_lte?: Maybe<Scalars['BigInt']>
  budget_in?: Maybe<Array<Scalars['BigInt']>>
}

export type WorkingGroupWhereUniqueInput = {
  id: Scalars['ID']
}
