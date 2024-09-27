import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenType } from './constants/authentication.constants';
import { getDetailsFromContext } from '../../common/utils/permission.utils';
import { AuthenticationHelper } from './authentication.helper';
import { UserType } from '../../customer-interface/schema/graphql.schema';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authenticationHelper: AuthenticationHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { excReq, request } = getDetailsFromContext(context);
    const tokenType = this.reflector.get<TokenType>(
      'tokenType',
      context.getHandler(),
    );
    const token = await this.authenticationHelper.extractTokenFromRequest(
      request,
      UserType.Customer,
      tokenType,
      true,
    );
    if (token) {
      const claims = await this.authenticationHelper.verifySignedJWT(
        token,
        tokenType,
      );
      excReq.user = claims;
      return true;
    } else {
      throw new UnauthorizedException('Token is required');
    }
  }
}
