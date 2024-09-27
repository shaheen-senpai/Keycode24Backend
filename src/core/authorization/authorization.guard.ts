import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import UserService from './service/user.service';
import { OperationType } from '../../customer-interface/schema/graphql.schema';
import { getDetailsFromContext } from '../../common/utils/permission.utils';

@Injectable()
export class AuthorizationGaurd implements CanActivate {
  constructor(private userService: UserService, private reflector: Reflector) {}
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = getDetailsFromContext(context);
    const permissionsRequired = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    const operationType = this.reflector.get<OperationType>(
      'operationType',
      context.getHandler(),
    );
    const trackPermissions = this.reflector.get<string[]>(
      'trackPermissions',
      context.getHandler(),
    );
    const { verified, matchedPermissions } =
      await this.userService.verifyAndFetchUserPermissions(
        user,
        permissionsRequired,
        operationType,
        trackPermissions,
      );
    if (verified && user) {
      user.matchedPermissions = matchedPermissions;
    }
    return verified;
  }
}
