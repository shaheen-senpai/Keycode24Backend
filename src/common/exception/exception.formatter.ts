import { GraphQLError, GraphQLFormattedError } from 'graphql';

export default function formatGraphqlError(
  error: GraphQLError,
): GraphQLFormattedError {
  const responseException: any = error?.extensions;
  const graphQLFormattedError: GraphQLFormattedError = {
    message: responseException?.response?.message || error?.message,
    path: error.path,
    extensions: {
      statusCode:
        responseException?.response?.statusCode || error?.extensions?.status,
      error: responseException?.response?.error,
    },
  };
  return graphQLFormattedError;
}
