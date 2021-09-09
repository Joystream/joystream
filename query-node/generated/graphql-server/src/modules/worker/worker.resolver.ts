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
  WorkerCreateInput,
  WorkerCreateManyArgs,
  WorkerUpdateArgs,
  WorkerWhereArgs,
  WorkerWhereInput,
  WorkerWhereUniqueInput,
  WorkerOrderByEnum,
} from '../../../generated';

import { Worker } from './worker.model';
import { WorkerService } from './worker.service';

import { DataObject } from '../data-object/data-object.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class WorkerEdge {
  @Field(() => Worker, { nullable: false })
  node!: Worker;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class WorkerConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [WorkerEdge], { nullable: false })
  edges!: WorkerEdge[];

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
export class WorkerConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => WorkerWhereInput, { nullable: true })
  where?: WorkerWhereInput;

  @Field(() => WorkerOrderByEnum, { nullable: true })
  orderBy?: [WorkerOrderByEnum];
}

@Resolver(Worker)
export class WorkerResolver {
  constructor(@Inject('WorkerService') public readonly service: WorkerService) {}

  @Query(() => [Worker])
  async workers(
    @Args() { where, orderBy, limit, offset }: WorkerWhereArgs,
    @Fields() fields: string[]
  ): Promise<Worker[]> {
    return this.service.find<WorkerWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => Worker, { nullable: true })
  async workerByUniqueInput(
    @Arg('where') where: WorkerWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<Worker | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => WorkerConnection)
  async workersConnection(
    @Args() { where, orderBy, ...pageOptions }: WorkerConnectionWhereArgs,
    @Info() info: any
  ): Promise<WorkerConnection> {
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
      result = await this.service.findConnection<WorkerWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<WorkerConnection>;
  }

  @FieldResolver(() => DataObject)
  async dataObjects(@Root() r: Worker): Promise<DataObject[] | null> {
    const result = await getConnection()
      .getRepository(Worker)
      .findOne(r.id, { relations: ['dataObjects'] });
    if (result && result.dataObjects !== undefined) {
      return result.dataObjects;
    }
    return null;
  }
}
