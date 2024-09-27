import { ContextType, ExecutionContext } from '@nestjs/common';
import {
  AccessTokenData,
  permissionsWithLimit,
  permissionsWithLimitForDev,
} from '../../core/authorization/constants/authorization.constants';

export const hasPermission = (user: AccessTokenData, permission: string) => {
  return (
    user.matchedPermissions && user.matchedPermissions.includes(permission)
  );
};
export const hasPermissionsOR = (
  user: AccessTokenData,
  permissions: string[],
) => {
  return permissions.some(
    (item) => user.matchedPermissions && user.matchedPermissions.includes(item),
  );
};

/**
 * General function to get details from execution context(REST-API)
 * @param context ExecutionContext
 * @returns excReq, request and authenticated user
 * excReq - The excReq is determined by the request type (REST or GraphQL) used to incorporate authenticated user details and other relevant information.
 */
export const getDetailsFromContext = (context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  const excReq = request;
  return { excReq, request, user: excReq.user };
};

export const getLimitPermissionInformation = (name: string) => {
  if (['production', 'stage'].includes(process.env.ENV || ''))
    return permissionsWithLimit[name];
  else return permissionsWithLimitForDev[name];
};
