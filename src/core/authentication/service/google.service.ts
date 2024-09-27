import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { DeepPartial } from 'typeorm';
import {
  InvalidEmailException,
  InvalidPayloadException,
} from '../exception/userauth.exception';
import { GoogleUserSchema } from '../validation/userauthschema.validation';
import { GoogleLoginUser } from '../passport/googleStrategy';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import UserService from '../../authorization/service/user.service';

import {
  ALLOWED_MAIL_DOMAIN,
  UNAUTHENTICATED_ERROR_MESSAGE,
} from '../constants/authentication.constants';
import {
  PlanDetail,
  UserOrigin,
} from '../../../customer-interface/schema/graphql.schema';
import { GeneralApplicationException } from '../../../common/exception/general.application.exception';
import { EnableLog } from '../../authorization/logging.decorator';
import User from '../../../core/authorization/entity/user.entity';
import { AuthenticationMixpanelService } from '../../mixpanel/service/authentication.mixpanel.service';
import { Origin } from '../../mixpanel/constants/mixpanel.constants';
import { UserMixpanelService } from '../../mixpanel/service/user.mixpanel.service';
import { CustomTransactional } from '../../../common/decorator/custom.transactional';

@Injectable()
export class GoogleAuthService {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private authenticationMixpanelService: AuthenticationMixpanelService,
    private userMixpanelService: UserMixpanelService,
  ) {}

  client = new OAuth2Client();

  private async validateInput(
    googleLoginInput: GoogleLoginUser,
  ): Promise<GoogleLoginUser> {
    const { error } = GoogleUserSchema.validate(googleLoginInput);
    if (error) {
      throw new InvalidPayloadException(
        'Insufficient data from Google signin. '.concat(error.message),
      );
    }

    return googleLoginInput;
  }

  /**
   * To Login using Google email
   * @param googleLoginInput GoogleLoginUser
   * @param planDetail PlanDetail
   */
  // Deprecated
  @Transactional()
  @EnableLog()
  async googleLogin(
    googleLoginInput: GoogleLoginUser,
    planDetail?: PlanDetail,
  ) {
    const googleUser = await this.validateInput(googleLoginInput);
    const email = googleUser.email;
    if (!email) {
      throw new BadRequestException('Email is not provided');
    }
    let existingUser = await this.userService.getUserDetailsForToken({
      email,
    });
    if (!existingUser) {
      const newUser = {
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        origin: UserOrigin.Google,
      };
      existingUser = await this.userService.createUser(newUser, planDetail);
      if (!existingUser) {
        throw new GeneralApplicationException('Unable to create User');
      }
      return existingUser;
    } else if (existingUser && existingUser.isCustomer === false) {
      throw new InvalidEmailException();
    }
    if (existingUser && !existingUser.firstName) {
      existingUser.firstName = googleUser.firstName;
      existingUser.lastName = googleUser.lastName;
      existingUser = await this.userService.saveUser(existingUser);
    }
    return existingUser;
  }

  /**
   * To Login using Google AuthClient
   * @param googleLoginInput GoogleLoginUser
   * @param planDetail PlanDetail
   */
  @Transactional()
  @CustomTransactional()
  @EnableLog()
  async googleUserLogin(googleLoginInput: GoogleLoginUser): Promise<User> {
    const googleUser = await this.validateInput(googleLoginInput);
    const email = googleUser.email;
    if (!email) {
      throw new BadRequestException('Email is not provided');
    }
    let existingUser = await this.userService.findOne({
      where: { email },
    });
    if (!existingUser) {
      const newUser: DeepPartial<User> = {
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        origin: UserOrigin.Google,
        isEmailVerified: true,
      };
      existingUser = await this.userService.createUserV2(newUser);
      if (!existingUser) {
        throw new GeneralApplicationException('Unable to create User');
      }
      await Promise.all([
        this.userMixpanelService.upsertUserProfile(existingUser),
        this.authenticationMixpanelService.trackSignUp(
          existingUser,
          Origin.Google,
        ),
      ]);
      return existingUser;
    } else if (existingUser && existingUser.isCustomer === false) {
      throw new InvalidEmailException();
    }
    if (
      existingUser &&
      (!existingUser.firstName || !existingUser.isEmailVerified)
    ) {
      if (!existingUser.firstName) {
        existingUser.firstName = googleUser.firstName;
        existingUser.lastName = googleUser.lastName;
      }
      // if the user has password and email is not verified, need to clear the password
      if (existingUser.password && !existingUser.isEmailVerified) {
        existingUser.password = null;
      }
      existingUser.isEmailVerified = true;
      existingUser = await this.userService.saveUser(existingUser);
    }
    await Promise.all([
      this.userMixpanelService.upsertUserProfile(existingUser),
      this.authenticationMixpanelService.trackLogin(
        existingUser,
        Origin.Google,
      ),
    ]);
    return existingUser;
  }

  /**
   * To login using Google Token
   * @param token string
   */
  @Transactional()
  @EnableLog()
  async googleLoginByToken(token: string) {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: [this.configService.get<string>('GOOGLE_CLIENT_ID') as string],
    });
    this.client.getTokenInfo(token);
    const payload = ticket.getPayload();
    const googleLogin = {
      email: payload?.email as string,
      firstName: payload?.given_name as string,
      lastName: payload?.family_name as string,
      externalUserId: payload?.sub as string,
    };
    const domain = payload?.['hd'];
    if (domain != ALLOWED_MAIL_DOMAIN) {
      throw new UnauthorizedException(UNAUTHENTICATED_ERROR_MESSAGE);
    }

    const res = await this.googleLogin(googleLogin);
    return res;
  }
}
