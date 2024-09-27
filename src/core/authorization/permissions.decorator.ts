import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../authentication/authentication.guard';
import { OperationType } from '../../customer-interface/schema/graphql.schema';
import { AuthorizationGaurd } from './authorization.guard';

export const Permissions = (
  permissions: string[] | string,
  trackPermissions: string[] | string = [],
  operationType: OperationType = OperationType.OR,
) => {
  return applyDecorators(
    UseGuards(AuthGuard, AuthorizationGaurd),
    SetMetadata(
      'permissions',
      permissions instanceof Array ? permissions : [permissions],
    ),
    SetMetadata(
      'trackPermissions',
      trackPermissions instanceof Array ? trackPermissions : [trackPermissions],
    ),
    SetMetadata('operationType', operationType),
  );
};
