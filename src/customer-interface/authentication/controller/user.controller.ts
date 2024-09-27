import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as multer from 'multer';
import { PermissionsType } from '../../../core/authorization/constants/authorization.constants';
import UserauthService from '../../../core/authentication/service/userauth.service';
import UserService from '../../../core/authorization/service/user.service';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import { AuthenticationHelper } from '../../../core/authentication/authentication.helper';
import { CollaboratorPermissions } from '../../../core/collaboration/collaboration.decorator';
import { CollaboratorType } from '../../../customer-interface/schema/graphql.schema';
import { collaborationEntities } from '../../../core/collaboration/constants/collaboration.constants';
import { RequestDemoSchema } from 'src/core/authorization/validation/user.validation.schema';
import { validate } from 'src/common/utils/validation.utils';

@Controller('user')
export class UserController {
  constructor(
    private userAuthService: UserauthService,
    private userService: UserService,
    private configService: ConfigService,
    private authenticationHelper: AuthenticationHelper,
  ) {}

  @Get('verify')
  async verify(
    @Res() response: Response,
    @Query('token') token: string,
    @Query('activateFreeTrial') activateFreeTrial?: boolean,
  ) {
    const resp = await this.userAuthService.verifyEmail(token);
    if (resp.action === 'redirectToLogin') {
      return response.redirect(
        `${this.configService.get('WEB_APP_URL')}/auth/verification-success${
          activateFreeTrial ? '?activateFreeTrial=true' : ''
        }`,
      );
    }
    return response.json(resp);
  }

  @Get('userOrganisationInvitation')
  async userOrganisationInvitation(
    @Res() response: Response,
    @Query('token') token: string,
  ) {
    const resp = await this.userService.userOrganisationInvitation(token);
    const webUrl = this.configService.get('WEB_APP_URL');
    if (resp.action === 'redirectToLogin') {
      return response.redirect(`${webUrl}/auth/sign-in`);
    } else if (resp.action === 'redirectToSetPassword') {
      return response.redirect(
        `${webUrl}/auth/set-password?email=${resp.email}&token=${resp.token}`,
      );
    } else if (resp.action === 'redirectToInvitationNotFound') {
      return response.redirect(`${webUrl}/auth/revoke-org-invitation`);
    }
    return response.json(resp);
  }

  @Get('reset-mfa')
  async resetMfa(@Res() response: Response, @Query('token') token: string) {
    try {
      const { notification } = await this.userService.resetMfa(token);
      return response.redirect(
        `${this.configService.get('WEB_APP_URL')}/auth/sign-in?notification=${
          notification || 'reset-mfa-error'
        }`,
      );
    } catch (error) {
      return response.redirect(
        `${this.configService.get(
          'WEB_APP_URL',
        )}/auth/sign-in?notification=reset-mfa-error`,
      );
    }
  }

  @Permissions([PermissionsType.CustomerCreateContractTemplate])
  @Get('get-ckeditor-word-token')
  async getEditorAuthToken() {
    return this.authenticationHelper.genearteCKEditorImportWordAuthToken();
  }

  @CollaboratorPermissions(
    CollaboratorType.RequestReceiver,
    collaborationEntities.TEMPLATE,
  )
  @Get('get-ckeditor-word-token-request-receiver')
  async getEditorAuthTokenForRequestReceiver() {
    return this.authenticationHelper.genearteCKEditorImportWordAuthToken();
  }

  @Post('contact')
  @UseInterceptors(AnyFilesInterceptor({ storage: multer.memoryStorage() }))
  async requestDemo(
    @Body() input: { email: string; message: string },
    @Res() response: Response,
  ) {
    try {
      const data = await validate(RequestDemoSchema, input);
      await this.userService.requestDemo(data);
      return response
        .status(200)
        .json({ message: 'Request sent successfully' });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
