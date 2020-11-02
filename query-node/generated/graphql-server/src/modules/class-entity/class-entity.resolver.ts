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
} from 'type-graphql';
import { Inject } from 'typedi';
import { Min } from 'class-validator';
import { Fields, StandardDeleteResponse, UserId, PageInfo, RawFields } from 'warthog';

import {
  ClassEntityCreateInput,
  ClassEntityCreateManyArgs,
  ClassEntityUpdateArgs,
  ClassEntityWhereArgs,
  ClassEntityWhereInput,
  ClassEntityWhereUniqueInput,
  ClassEntityOrderByEnum,
} from '../../../generated';

import { ClassEntity } from './class-entity.model';
import { ClassEntityService } from './class-entity.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class ClassEntityEdge {
  @Field(() => ClassEntity, { nullable: false })
  node!: ClassEntity;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class ClassEntityConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [ClassEntityEdge], { nullable: false })
  edges!: ClassEntityEdge[];

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
export class ClassEntityConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => ClassEntityWhereInput, { nullable: true })
  where?: ClassEntityWhereInput;

  @Field(() => ClassEntityOrderByEnum, { nullable: true })
  orderBy?: ClassEntityOrderByEnum;
}

@Resolver(ClassEntity)
export class ClassEntityResolver {
  constructor(@Inject('ClassEntityService') public readonly service: ClassEntityService) {}

  @Query(() => [ClassEntity])
  async classEntitys(
    @Args() { where, orderBy, limit, offset }: ClassEntityWhereArgs,
    @Fields() fields: string[]
  ): Promise<ClassEntity[]> {
    return this.service.find<ClassEntityWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => ClassEntityConnection)
  async classEntityConnection(
    @Args() { where, orderBy, ...pageOptions }: ClassEntityConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<ClassEntityConnection> {
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
      result = await this.service.findConnection<ClassEntityWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<ClassEntityConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: ClassEntity): Promise<Block> {
    const result = await getConnection()
      .getRepository(ClassEntity)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for ClassEntity.happenedIn');
    }
    return result.happenedIn;
  }
}
