import {
  Controller,
  Get,
  Query,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '../../../common/logger/logger.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { OnBoardingTokenType, UserType } from '../../schema/graphql.schema';
import { google } from 'googleapis';
import { generalError } from '../../../common/exception/general.application.exception';
import { GoogleAuthService } from '../../../core/authentication/service/google.service';
import { AuthenticationHelper } from '../../../core/authentication/authentication.helper';
import {
  LoginResponseCode,
  TokenType,
  UpdatePasswordTokenClaims,
} from '../../../core/authentication/constants/authentication.constants';
import UserauthService from '../../../core/authentication/service/userauth.service';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import { PermissionsType } from 'src/core/authorization/constants/authorization.constants';
import { UserLinkedAccountsService } from 'src/core/authorization/service/userLinkedAccounts.service';

@Controller('google')
export class GoogleAuthController {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private userAuthService: UserauthService,
    private readonly authenticationHelper: AuthenticationHelper,
    private readonly configService: ConfigService,
    private logger: LoggerService,
    private userLinkedAccountsService: UserLinkedAccountsService,
  ) {}

  @Get()
  async googleAuth(
    @Res() response: Response,
    @Query('plan') plan: string,
    @Query('billingMode') billingMode: string,
    @Query('subscriptionMode') subscriptionMode: string,
    @Query('version') version: string,
  ) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_SECRET'),
      `${this.configService.get('APP_URL')}/ums/api/google/redirect`,
    );
    const scopes = ['profile', 'email'];
    let stateData: Record<string, string> = { version };
    plan &&
      billingMode &&
      subscriptionMode &&
      (stateData = { ...stateData, plan, billingMode, subscriptionMode });
    const state = encodeURIComponent(JSON.stringify(stateData));
    const authorizationUrl = oauth2Client.generateAuthUrl({
      scope: scopes,
      state,
    });
    this.logger.info('Redirecting to google login');
    return response.redirect(authorizationUrl);
  }

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  async googleLogin(
    @Req() request: any,
    @Res() response: Response,
    @Query('state') state: string,
  ) {
    try {
      let planDetail;
      try {
        planDetail = JSON.parse(decodeURIComponent(state));
      } catch {
        // Invalid json obtained from state and skipping plan details
      }
      // googleUserLogin is the new flow for google login. in order to keep backward compatibility, we are keeping the old version. This will be removed in future and can bring logic in the googleUserLogin to this function.
      if (planDetail.version === '2') {
        return await this.googleUserLogin(request, response);
      }
      const user = await this.googleAuthService.googleLogin(
        request.user,
        planDetail,
      );
      if (user && user.isEmailVerified) {
        let authResponse;
        try {
          authResponse = await this.userAuthService.checkOrgAuthentication(
            user,
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
      } else if (user) {
        // CASE 1 : When the onboarding is not yet complete, we choose the org created by the user
        const userOrgs = user.userOrganisation;
        const createdUserOrg = userOrgs.find(
          (item) => item.organisation.createdById === user.id,
        );
        const isValid =
          createdUserOrg &&
          (await this.userAuthService.isUserOrgValid(createdUserOrg));
        if (isValid && isValid.status === '1') {
          const signUpToken = await this.authenticationHelper.generateSignedJWT(
            {
              type: OnBoardingTokenType.Google,
              userOrgId: createdUserOrg.id,
            },
            TokenType.OnboardToken,
          );
          let path = 'choose-account-type';
          planDetail?.plan === 'E-SIGN' && (path = 'individual-data');
          planDetail?.plan === 'Essential' && (path = 'organisation-data');
          return response.redirect(
            `${this.configService.get(
              'WEB_APP_URL',
            )}/${path}?token=${signUpToken}`,
          );
        } else {
          // CASE 2: when the organisation created by the user does not exist or is invalid
          try {
            const userOrg =
              await this.userAuthService.getLastActiveUserOrganisation(user);
            if (userOrg) {
              const token = await this.authenticationHelper.generateSignedJWT(
                {
                  email: user.email,
                  userOrgId: userOrg.id,
                  type: 'userAddedToOrganisation',
                } as UpdatePasswordTokenClaims,
                TokenType.UpdatePasswordToken,
              );
              return response.redirect(
                `${this.configService.get('WEB_APP_URL')}/set-password?email=${
                  user.email
                }&token=${token}`,
              );
            }
          } catch (error) {
            // CASE 3: The user is not active in any organisation
            // error is thrown for now but will be handled in the future
            response.send('Your access to the organisation has been revoked');
            generalError('Your access to the organisation has been revoked');
          }
        }
      }
    } catch (err) {
      this.logger.error(
        `Error on google login ${
          err.stack ? JSON.stringify(err.stack) : err.message
        }`,
      );
    }
  }

  async googleUserLogin(request: any, response: Response) {
    try {
      const user = await this.googleAuthService.googleUserLogin(request.user);
      const authResponse = await this.userAuthService.checkOrgAuthentication(
        user,
        UserType.Customer,
        true,
        false,
      );
      if (
        [
          LoginResponseCode.MFA_AUTH_REQUIRED.statusCode,
          LoginResponseCode.MFA_SETUP_REQUIRED.statusCode,
        ].includes(authResponse.statusCode)
      ) {
        return response.redirect(
          `${this.configService.get('WEB_APP_URL')}/auth/${
            authResponse.statusCode === 'LOGIN-003'
              ? 'totp-verification'
              : 'totp-setup'
          }?token=${authResponse.token?.accessToken}`,
        );
      }
      response = await this.userAuthService.addtokenToResponse(
        response,
        authResponse.token,
      );
      return response.redirect(
        `${this.configService.get('WEB_APP_URL')}/redirect`,
      );
    } catch (err) {
      this.logger.error(
        `Error on google login ${
          err.stack ? JSON.stringify(err.stack) : err.message
        }`,
      );
      return response.redirect(
        `${this.configService.get('WEB_APP_URL')}/google-login-error`,
      );
    }
  }

  @Post('authenticate')
  async authenticate(@Req() request: any) {
    return this.googleAuthService.googleLoginByToken(request.body.token);
  }

  @Permissions([
    PermissionsType.CustomerCreateGoogleCalendarIntegration,
    PermissionsType.CustomerEditGoogleCalendarIntegration,
  ])
  @Get('calendar-auth')
  async googleCalendarAuth(@Res() response: Response, @Req() req: any) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_SECRET'),
      `${this.configService.get('APP_URL')}/ums/api/google/calendar-redirect`,
    );
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    const state = encodeURIComponent(
      JSON.stringify({
        userId: req.user.id,
        organisationId: req.user.organisation.id,
      }),
    );
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state,
    });
    this.logger.info('Redirecting to google calendar consent screen');
    return response.redirect(authorizationUrl);
  }

  @Get('calendar-redirect')
  async googleCalendarRedirect(
    @Res() response: Response,
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('state') state: string,
  ) {
    const redirectWebUrl = `${this.configService.get('WEB_APP_URL')}/settings`;
    try {
      if (error) {
        return response.redirect(`${redirectWebUrl}?error=${error}`);
      }
      const user = JSON.parse(decodeURIComponent(state));
      const oauth2Client = new google.auth.OAuth2(
        this.configService.get('GOOGLE_CLIENT_ID'),
        this.configService.get('GOOGLE_SECRET'),
        `${this.configService.get('APP_URL')}/ums/api/google/calendar-redirect`,
      );
      const { tokens } = await oauth2Client.getToken(code);
      if (tokens.refresh_token) {
        await this.userLinkedAccountsService.upsertGoogleCalendarAccount(
          user,
          tokens.refresh_token,
        );
        return response.redirect(redirectWebUrl);
      }
      // TODO -error code need to standardised after discussing with FE team
      return response.redirect(`${redirectWebUrl}?error=somethingWentWrong`);
    } catch (err) {
      this.logger.error(
        `Error on google calendar redirect ${
          err.stack ? JSON.stringify(err.stack) : err.message
        }`,
      );
      return response.redirect(`${redirectWebUrl}?error=somethingWentWrong`);
    }
  }
}
