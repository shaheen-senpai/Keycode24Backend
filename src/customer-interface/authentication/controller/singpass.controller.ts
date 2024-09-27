import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { LoggerService } from '../../../common/logger/logger.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SingpassService } from '../../../core/authentication/service/singpass.service';
import UserauthService from '../../../core/authentication/service/userauth.service';
import { generalError } from '../../../common/exception/general.application.exception';
import User from '../../../core/authorization/entity/user.entity';
import { UserType } from '../../../customer-interface/schema/graphql.schema';
import { LoginResponseCode } from '../../../core/authentication/constants/authentication.constants';
@Controller('singpass')
export class SingpassController {
  constructor(
    private singpassService: SingpassService,
    private logger: LoggerService,
    private userAuthService: UserauthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Redirect URL to which the user will be redirected on successfull singpass login
   */
  @Get('redirect')
  async singLogin(
    @Req() request: any,
    @Res() response: Response,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    try {
      const resp = await this.singpassService.singpassLogin(code, state);
      if (resp?.action === 'addEmail') {
        const { signedJWT, plan } = resp;
        return response.redirect(
          `${this.configService.get(
            'WEB_APP_URL',
          )}/singpass?token=${signedJWT}&plan=${plan ? plan : ''}`,
        );
      } else if (resp?.action === 'dashboard') {
        let authResponse;
        try {
          authResponse = await this.userAuthService.checkOrgAuthentication(
            resp.user as User,
            UserType.Customer,
            true,
          );
        } catch (error) {
          response.send('Your access to the organisation has been revoked');
          generalError('Your access to the organisation has been revoked');
        }
        if (
          [
            LoginResponseCode.MFA_AUTH_REQUIRED.statusCode,
            LoginResponseCode.MFA_SETUP_REQUIRED.statusCode,
          ].includes(authResponse.statusCode)
        ) {
          return response.redirect(
            `${this.configService.get(
              'WEB_APP_URL',
            )}/login/totp-verification?token=${
              authResponse.token?.accessToken
            }&status=${
              authResponse.statusCode ===
              LoginResponseCode.MFA_AUTH_REQUIRED.statusCode
                ? 'MFA-AUTH-REQUIRED'
                : 'MFA-SETUP-REQUIRED'
            }`,
          );
        }
        response = await this.userAuthService.addtokenToResponse(
          response,
          authResponse.token,
        );
        return response.redirect(
          `${this.configService.get('WEB_APP_URL')}/redirect`,
        );
      }
      return response.json(resp);
    } catch (err) {
      this.logger.error(
        `Error on singpass login ${
          err.stack ? JSON.stringify(err.stack) : err.message
        }`,
      );
      return response.json(err);
    }
  }

  /**
   * GET endpoint to expose our application's public keys(signature and encryption).
   * Used by Singpass.
   */
  @Get('jwks')
  async jwks(@Res() response: Response) {
    const keyStore = await this.singpassService.getKeyStore();
    return response.json(keyStore);
  }

  @Get('verify')
  async verify(@Res() response: Response, @Query('token') token: string) {
    try {
      const resp = await this.singpassService.verifyLink(token);
      if (resp.action === 'dashboard') {
        let authResponse;
        try {
          authResponse = await this.userAuthService.checkOrgAuthentication(
            resp.user as User,
            UserType.Customer,
            true,
          );
        } catch (error) {
          return response.send(
            'Your access to the organisation has been revoked',
          );
        }
        if (
          [
            LoginResponseCode.MFA_AUTH_REQUIRED.statusCode,
            LoginResponseCode.MFA_SETUP_REQUIRED.statusCode,
          ].includes(authResponse.statusCode)
        ) {
          return response.redirect(
            `${this.configService.get(
              'WEB_APP_URL',
            )}/login/totp-verification?token=${
              authResponse.token?.accessToken
            }&status=${
              authResponse.statusCode ===
              LoginResponseCode.MFA_AUTH_REQUIRED.statusCode
                ? 'MFA-AUTH-REQUIRED'
                : 'MFA-SETUP-REQUIRED'
            }`,
          );
        }
        response = await this.userAuthService.addtokenToResponse(
          response,
          authResponse.token,
        );
        return response.redirect(
          `${this.configService.get('WEB_APP_URL')}/redirect`,
        );
      } else if (resp.action === 'error') {
        return response.send(resp.message);
      }
    } catch (error) {
      return response.send(error);
    }
  }
}
