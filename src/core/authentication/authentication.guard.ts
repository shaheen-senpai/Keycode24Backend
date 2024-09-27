import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { UserType } from '../../customer-interface/schema/graphql.schema';
import { AuthenticationHelper } from './authentication.helper';
import {
  AuthTarget,
  TokenType,
  UNAUTHENTICATED_ERROR_MESSAGE,
} from './constants/authentication.constants';
import UserauthService from './service/userauth.service';
import { AccessTokenData } from '../authorization/constants/authorization.constants';
import { getDetailsFromContext } from '../../common/utils/permission.utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authenticationHelper: AuthenticationHelper,
    private userAuthService: UserauthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { excReq, request } = getDetailsFromContext(context);
    const path = request.originalUrl;
    // Identifying userType(Admin or Customer) by checking the url.
    const userType: UserType = path.startsWith('/ums/api/admin')
      ? UserType.Admin
      : UserType.Customer;
    const target: AuthTarget =
      this.reflector.get<AuthTarget>('target', context.getHandler()) ||
      AuthTarget.Organisation;
    const token = await this.authenticationHelper.extractTokenFromRequest(
      request,
      userType,
      TokenType.AccessToken,
    );
    if (token) {
      try {
        const user: AccessTokenData =
          this.authenticationHelper.validateAuthToken(
            token,
            TokenType.AccessToken,
            target,
          );
        if (user.userType !== userType) {
          throw new UnauthorizedException('Authentication token is invalid');
        }
        excReq.user = user;
        return true;
      } catch {
        const token = await this.tryRefresh(
          request,
          excReq?.res as Response,
          userType,
        );
        const user = this.authenticationHelper.validateAuthToken(
          token.accessToken,
          TokenType.AccessToken,
          target,
        );
        excReq.user = user;
        return true;
      }
    } else {
      throw new UnauthorizedException(UNAUTHENTICATED_ERROR_MESSAGE);
    }
  }

  /**
   * Method to do an internal refresh if the refresh token present in cookie is valid
   */
  private async tryRefresh(
    request: Request,
    response: Response,
    userType: UserType,
  ) {
    const refreshToken =
      request.signedCookies?.[
        this.authenticationHelper.getRefreshTokenCookieName(userType)
      ];
    const token = await this.userAuthService.refresh(refreshToken);
    await this.userAuthService.addtokenToResponse(response, token, userType);
    return token;
  }
}
