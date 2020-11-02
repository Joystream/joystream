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
  LanguageCreateInput,
  LanguageCreateManyArgs,
  LanguageUpdateArgs,
  LanguageWhereArgs,
  LanguageWhereInput,
  LanguageWhereUniqueInput,
  LanguageOrderByEnum,
} from '../../../generated';

import { Language } from './language.model';
import { LanguageService } from './language.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class LanguageEdge {
  @Field(() => Language, { nullable: false })
  node!: Language;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class LanguageConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [LanguageEdge], { nullable: false })
  edges!: LanguageEdge[];

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
export class LanguageConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => LanguageWhereInput, { nullable: true })
  where?: LanguageWhereInput;

  @Field(() => LanguageOrderByEnum, { nullable: true })
  orderBy?: LanguageOrderByEnum;
}

@Resolver(Language)
export class LanguageResolver {
  constructor(@Inject('LanguageService') public readonly service: LanguageService) {}

  @Query(() => [Language])
  async languages(
    @Args() { where, orderBy, limit, offset }: LanguageWhereArgs,
    @Fields() fields: string[]
  ): Promise<Language[]> {
    return this.service.find<LanguageWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => LanguageConnection)
  async languageConnection(
    @Args() { where, orderBy, ...pageOptions }: LanguageConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<LanguageConnection> {
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
      result = await this.service.findConnection<LanguageWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<LanguageConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: Language): Promise<Block> {
    const result = await getConnection()
      .getRepository(Language)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for Language.happenedIn');
    }
    return result.happenedIn;
  }
}
