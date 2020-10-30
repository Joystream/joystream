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
  UserDefinedLicenseCreateInput,
  UserDefinedLicenseCreateManyArgs,
  UserDefinedLicenseUpdateArgs,
  UserDefinedLicenseWhereArgs,
  UserDefinedLicenseWhereInput,
  UserDefinedLicenseWhereUniqueInput,
  UserDefinedLicenseOrderByEnum,
} from '../../../generated';

import { UserDefinedLicense } from './user-defined-license.model';
import { UserDefinedLicenseService } from './user-defined-license.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class UserDefinedLicenseEdge {
  @Field(() => UserDefinedLicense, { nullable: false })
  node!: UserDefinedLicense;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class UserDefinedLicenseConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [UserDefinedLicenseEdge], { nullable: false })
  edges!: UserDefinedLicenseEdge[];

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
export class UserDefinedLicenseConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => UserDefinedLicenseWhereInput, { nullable: true })
  where?: UserDefinedLicenseWhereInput;

  @Field(() => UserDefinedLicenseOrderByEnum, { nullable: true })
  orderBy?: UserDefinedLicenseOrderByEnum;
}

@Resolver(UserDefinedLicense)
export class UserDefinedLicenseResolver {
  constructor(@Inject('UserDefinedLicenseService') public readonly service: UserDefinedLicenseService) {}

  @Query(() => [UserDefinedLicense])
  async userDefinedLicenses(
    @Args() { where, orderBy, limit, offset }: UserDefinedLicenseWhereArgs,
    @Fields() fields: string[]
  ): Promise<UserDefinedLicense[]> {
    return this.service.find<UserDefinedLicenseWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => UserDefinedLicenseConnection)
  async userDefinedLicenseConnection(
    @Args() { where, orderBy, ...pageOptions }: UserDefinedLicenseConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<UserDefinedLicenseConnection> {
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
      result = await this.service.findConnection<UserDefinedLicenseWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<UserDefinedLicenseConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: UserDefinedLicense): Promise<Block> {
    const result = await getConnection()
      .getRepository(UserDefinedLicense)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for UserDefinedLicense.happenedIn');
    }
    return result.happenedIn;
  }
}
