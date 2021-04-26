import {
  Arg,
  Args,
  Mutation,
  Query,
  Root,
  Resolver,
  FieldResolver,
  ObjectType,
  Field,
  Int,
  ArgsType,
  Info,
} from 'type-graphql';
import graphqlFields from 'graphql-fields';
import { Inject } from 'typedi';
import { Min } from 'class-validator';
import { Fields, StandardDeleteResponse, UserId, PageInfo, RawFields } from 'warthog';

import {
  StorageProviderCreateInput,
  StorageProviderCreateManyArgs,
  StorageProviderUpdateArgs,
  StorageProviderWhereArgs,
  StorageProviderWhereInput,
  StorageProviderWhereUniqueInput,
  StorageProviderOrderByEnum,
} from '../../../generated';

import { StorageProvider } from './storage-provider.model';
import { StorageProviderService } from './storage-provider.service';

import { DataObject } from '../data-object/data-object.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class StorageProviderEdge {
  @Field(() => StorageProvider, { nullable: false })
  node!: StorageProvider;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class StorageProviderConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [StorageProviderEdge], { nullable: false })
  edges!: StorageProviderEdge[];

  @Field(() => PageInfo, { nullable: false })
  pageInfo!: PageInfo;
}

@ArgsType()
export class ConnectionPageInputOptions {
  @Field(() => Int, { nullable: true })
  @Min(0)
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string; // V3: TODO: should we make a RelayCursor scalar?

  @Field(() => Int, { nullable: true })
  @Min(0)
  last?: number;

  @Field(() => String, { nullable: true })
  before?: string;
}

@ArgsType()
export class StorageProviderConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => StorageProviderWhereInput, { nullable: true })
  where?: StorageProviderWhereInput;

  @Field(() => StorageProviderOrderByEnum, { nullable: true })
  orderBy?: StorageProviderOrderByEnum;
}

@Resolver(StorageProvider)
export class StorageProviderResolver {
  constructor(@Inject('StorageProviderService') public readonly service: StorageProviderService) {}

  @Query(() => [StorageProvider])
  async storageProviders(
    @Args() { where, orderBy, limit, offset }: StorageProviderWhereArgs,
    @Fields() fields: string[]
  ): Promise<StorageProvider[]> {
    return this.service.find<StorageProviderWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => StorageProvider, { nullable: true })
  async storageProviderByUniqueInput(
    @Arg('where') where: StorageProviderWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<StorageProvider | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => StorageProviderConnection)
  async storageProvidersConnection(
    @Args() { where, orderBy, ...pageOptions }: StorageProviderConnectionWhereArgs,
    @Info() info: any
  ): Promise<StorageProviderConnection> {
    const rawFields = graphqlFields(info, {}, { excludedFields: ['__typename'] });

    let result: any = {
      totalCount: 0,
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    // If the related database table does not have any records then an error is thrown to the client
    // by warthog
    try {
      result = await this.service.findConnection<StorageProviderWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<StorageProviderConnection>;
  }

  @FieldResolver(() => DataObject)
  async dataObjects(@Root() r: StorageProvider): Promise<DataObject[] | null> {
    const result = await getConnection()
      .getRepository(StorageProvider)
      .findOne(r.id, { relations: ['dataObjects'] });
    if (result && result.dataObjects !== undefined) {
      return result.dataObjects;
    }
    return null;
  }
}
