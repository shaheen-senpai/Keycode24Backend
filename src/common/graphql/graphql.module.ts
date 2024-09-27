import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import formatGraphqlError from '../exception/exception.formatter';
import { join } from 'path';
import dotenv from 'dotenv';
import { AdminModule } from '../../admin-interface/admin.module';
import * as coreModules from '../../core/index';
import { CustomerModule } from '../../customer-interface/customer.module';
// import { graphqlResolvers } from '../utils/graphql.resolver.utils';
import { getCORSOrigin } from '../utils/general.utils';
dotenv.config();
const options: ApolloDriverConfig = {
  driver: ApolloDriver,
  // cors: {
  //   credentials: true,
  //   origin: getCORSOrigin(),
  // },
  playground: process.env.ENV == 'production' ? false : true,
  useGlobalPrefix: true,
  // resolvers: graphqlResolvers,
  // formatError: formatGraphqlError,
  context: ({ req, res }: { req: any; res: any }) => ({
    headers: req.headers,
    res,
    req,
  }),
};
@Module({
  imports: [
    //For Users:
    GraphQLModule.forRoot<ApolloDriverConfig>({
      ...options,
      path: '/customer/graphql',
      include: [...Object.values(coreModules), CustomerModule],
      typePaths: [
        'src/core/**/*.graphql',
        'src/customer-interface/**/*.graphql',
      ],
      definitions: {
        path: join(
          process.cwd(),
          'src/customer-interface/schema/graphql.schema.ts',
        ),
      },
    }),

    //For Admins:
    GraphQLModule.forRoot({
      ...options,
      include: [...Object.values(coreModules), AdminModule],
      path: '/admin/graphql',
      typePaths: ['src/admin-interface/**/*.graphql', 'src/core/**/*.graphql'],
      definitions: {
        path: join(
          process.cwd(),
          'src/admin-interface/schema/graphql.schema.ts',
        ),
      },
    }),
  ],
})
export class AppGraphQLModule {}
