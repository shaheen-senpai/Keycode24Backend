import { ContextType, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const hasPermission = (user: any, permission: string) => {
  return (
    user.matchedPermissions && user.matchedPermissions.includes(permission)
  );
};
export const hasPermissionsOR = (user: any, permissions: string[]) => {
  return permissions.some(
    (item) => user.matchedPermissions && user.matchedPermissions.includes(item),
  );
};

/**
 * General function to get details from execution context(graphql or rest api)
 * @param context ExecutionContext
 * @returns excReq, request and authenticated user
 * excReq - The excReq is determined by the request type (REST or GraphQL)
 * used to incorporate authenticated user details and other relevant information.
 */
export const getDetailsFromContext = (context: ExecutionContext) => {
  const requestType =
    context.getType<ContextType | 'graphql'>() === 'graphql'
      ? 'graphql'
      : 'rest';
  const ctx = GqlExecutionContext.create(context).getContext();
  const request =
    requestType === 'graphql'
      ? (ctx.req as Request)
      : context.switchToHttp().getRequest();
  const excReq = requestType === 'graphql' ? ctx : request;
  return { excReq, request, user: excReq.user };
};
