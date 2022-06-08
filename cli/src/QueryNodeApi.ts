import { StorageNodeInfo, WorkingGroups } from './Types'
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
  DocumentNode,
  from,
  ApolloLink,
} from '@apollo/client/core'
import { ErrorLink, onError } from '@apollo/client/link/error'
import { Maybe } from './graphql/generated/schema'
import {
  GetStorageNodesInfoByBagId,
  GetStorageNodesInfoByBagIdQuery,
  GetStorageNodesInfoByBagIdQueryVariables,
  DataObjectInfoFragment,
  GetDataObjectsByBagId,
  GetDataObjectsByBagIdQuery,
  GetDataObjectsByBagIdQueryVariables,
  GetDataObjectsByVideoId,
  GetDataObjectsByVideoIdQuery,
  GetDataObjectsByVideoIdQueryVariables,
  GetDataObjectsByChannelId,
  GetDataObjectsByChannelIdQuery,
  GetDataObjectsByChannelIdQueryVariables,
  GetMembersByIds,
  GetMembersByIdsQuery,
  GetMembersByIdsQueryVariables,
  MembershipFieldsFragment,
  WorkingGroupOpeningDetailsFragment,
  OpeningDetailsByIdQuery,
  OpeningDetailsByIdQueryVariables,
  OpeningDetailsById,
  WorkingGroupApplicationDetailsFragment,
  ApplicationDetailsByIdQuery,
  ApplicationDetailsByIdQueryVariables,
  ApplicationDetailsById,
  UpcomingWorkingGroupOpeningByEventQuery,
  UpcomingWorkingGroupOpeningByEventQueryVariables,
  UpcomingWorkingGroupOpeningByEvent,
  UpcomingWorkingGroupOpeningDetailsFragment,
  UpcomingWorkingGroupOpeningByIdQuery,
  UpcomingWorkingGroupOpeningByIdQueryVariables,
  UpcomingWorkingGroupOpeningById,
  UpcomingWorkingGroupOpeningsByGroupQuery,
  UpcomingWorkingGroupOpeningsByGroupQueryVariables,
  UpcomingWorkingGroupOpeningsByGroup,
} from './graphql/generated/queries'
import { URL } from 'url'
import fetch from 'cross-fetch'
import { MemberId } from '@joystream/types/common'
import { ApplicationId, OpeningId } from '@joystream/types/working-group'
import { apiModuleByGroup } from './Api'

export default class QueryNodeApi {
  private _qnClient: ApolloClient<NormalizedCacheObject>

  public constructor(uri?: string, errorHandler?: ErrorLink.ErrorHandler) {
    const links: ApolloLink[] = []
    if (errorHandler) {
      links.push(onError(errorHandler))
    }
    links.push(new HttpLink({ uri, fetch }))
    this._qnClient = new ApolloClient({
      link: from(links),
      cache: new InMemoryCache({ addTypename: false }),
      defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
    })
  }

  // Get entity by unique input
  protected async uniqueEntityQuery<
    QueryT extends { [k: string]: Maybe<Record<string, unknown>> | undefined },
    VariablesT extends Record<string, unknown>
  >(
    query: DocumentNode,
    variables: VariablesT,
    resultKey: keyof QueryT
  ): Promise<Required<QueryT>[keyof QueryT] | null> {
    return (await this._qnClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey] || null
  }

  // Get entities by "non-unique" input and return first result
  protected async firstEntityQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT][number] | null> {
    return (await this._qnClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey][0] || null
  }

  // Get multiple entities
  protected async multipleEntitiesQuery<
    QueryT extends { [k: string]: unknown[] },
    VariablesT extends Record<string, unknown>
  >(query: DocumentNode, variables: VariablesT, resultKey: keyof QueryT): Promise<QueryT[keyof QueryT]> {
    return (await this._qnClient.query<QueryT, VariablesT>({ query, variables })).data[resultKey]
  }

  async dataObjectsByBagId(bagId: string): Promise<DataObjectInfoFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByBagIdQuery, GetDataObjectsByBagIdQueryVariables>(
      GetDataObjectsByBagId,
      { bagId },
      'storageDataObjects'
    )
  }

  async dataObjectsByVideoId(videoId: string): Promise<DataObjectInfoFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByVideoIdQuery, GetDataObjectsByVideoIdQueryVariables>(
      GetDataObjectsByVideoId,
      { videoId },
      'storageDataObjects'
    )
  }

  async dataObjectsByChannelId(channelId: string): Promise<DataObjectInfoFragment[]> {
    return this.multipleEntitiesQuery<GetDataObjectsByChannelIdQuery, GetDataObjectsByChannelIdQueryVariables>(
      GetDataObjectsByChannelId,
      { channelId },
      'storageDataObjects'
    )
  }

  async storageNodesInfoByBagId(bagId: string): Promise<StorageNodeInfo[]> {
    const result = await this.multipleEntitiesQuery<
      GetStorageNodesInfoByBagIdQuery,
      GetStorageNodesInfoByBagIdQueryVariables
    >(GetStorageNodesInfoByBagId, { bagId }, 'storageBuckets')

    const validNodesInfo: StorageNodeInfo[] = []
    for (const { operatorMetadata, id } of result) {
      if (operatorMetadata?.nodeEndpoint) {
        try {
          const rootEndpoint = operatorMetadata.nodeEndpoint
          const apiEndpoint = new URL(
            'api/v1',
            rootEndpoint.endsWith('/') ? rootEndpoint : rootEndpoint + '/'
          ).toString()
          validNodesInfo.push({
            apiEndpoint,
            bucketId: parseInt(id),
          })
        } catch (e) {
          continue
        }
      }
    }
    return validNodesInfo
  }

  async membersByIds(ids: MemberId[] | string[]): Promise<MembershipFieldsFragment[]> {
    return this.multipleEntitiesQuery<GetMembersByIdsQuery, GetMembersByIdsQueryVariables>(
      GetMembersByIds,
      {
        ids: ids.map((id) => id.toString()),
      },
      'memberships'
    )
  }

  async openingDetailsById(
    group: WorkingGroups,
    id: OpeningId | number
  ): Promise<WorkingGroupOpeningDetailsFragment | null> {
    return this.uniqueEntityQuery<OpeningDetailsByIdQuery, OpeningDetailsByIdQueryVariables>(
      OpeningDetailsById,
      { id: `${apiModuleByGroup[group]}-${id.toString()}` },
      'workingGroupOpeningByUniqueInput'
    )
  }

  async applicationDetailsById(
    group: WorkingGroups,
    id: ApplicationId | number
  ): Promise<WorkingGroupApplicationDetailsFragment | null> {
    return this.uniqueEntityQuery<ApplicationDetailsByIdQuery, ApplicationDetailsByIdQueryVariables>(
      ApplicationDetailsById,
      { id: `${apiModuleByGroup[group]}-${id.toString()}` },
      'workingGroupApplicationByUniqueInput'
    )
  }

  async upcomingWorkingGroupOpeningByEvent(
    blockNumber: number,
    indexInBlock: number
  ): Promise<UpcomingWorkingGroupOpeningDetailsFragment | null> {
    return this.firstEntityQuery<
      UpcomingWorkingGroupOpeningByEventQuery,
      UpcomingWorkingGroupOpeningByEventQueryVariables
    >(UpcomingWorkingGroupOpeningByEvent, { blockNumber, indexInBlock }, 'upcomingWorkingGroupOpenings')
  }

  async upcomingWorkingGroupOpeningById(id: string): Promise<UpcomingWorkingGroupOpeningDetailsFragment | null> {
    return this.uniqueEntityQuery<UpcomingWorkingGroupOpeningByIdQuery, UpcomingWorkingGroupOpeningByIdQueryVariables>(
      UpcomingWorkingGroupOpeningById,
      { id },
      'upcomingWorkingGroupOpeningByUniqueInput'
    )
  }

  async upcomingWorkingGroupOpeningsByGroup(
    group: WorkingGroups
  ): Promise<UpcomingWorkingGroupOpeningDetailsFragment[]> {
    return this.multipleEntitiesQuery<
      UpcomingWorkingGroupOpeningsByGroupQuery,
      UpcomingWorkingGroupOpeningsByGroupQueryVariables
    >(UpcomingWorkingGroupOpeningsByGroup, { workingGroupId: apiModuleByGroup[group] }, 'upcomingWorkingGroupOpenings')
  }
}
