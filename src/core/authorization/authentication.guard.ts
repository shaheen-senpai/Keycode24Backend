import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { getDetailsFromContext } from '../../common/utils/permission.utils';
import { AuthenticationHelper } from './service/authentication.helper';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authenticationHelper: AuthenticationHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { excReq, request } = getDetailsFromContext(context);
    const token = await this.authenticationHelper.extractTokenFromRequest(
      request,
    );
    if (token) {
      try {
        const user: any =
          await this.authenticationHelper.verifySignedJWT(
            token,
          );
        excReq.user = user;
        return true;
      } catch {
        throw new UnauthorizedException();
      }
    } else {
      throw new UnauthorizedException();
    }
  }
}
