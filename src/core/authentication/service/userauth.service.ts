import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { CookieOptions, Response, Request } from 'express';
import { v4 as uuid } from 'uuid';
import UserRefreshToken from '../../authorization/entity/userRefreshToken.entity';
import {
  AuthenticateTotpInput,
  AuthOutput,
  CountRange,
  InviteStatus,
  LinkedAccountType,
  MFAOrgDetailsOutput,
  OnBoardingDetails,
  OnBoardingTokenType,
  OnBoardingType,
  OnBoardInput,
  OrganisationOrigin,
  PlanDetail,
  StatusResponse,
  SubscriptionMode,
  TokenResponse,
  TotpQrOutput,
  UserLoginInput,
  UserOrganisationStatus,
  UserOrigin,
  UserSignupInput,
  UserType,
} from '../../../customer-interface/schema/graphql.schema';
import {
  EntityManager,
  EntityNotFoundError,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import UserService from '../../authorization/service/user.service';
import User from '../../authorization/entity/user.entity';
import { AuthenticationHelper } from '../authentication.helper';
import {
  ALLOWED_MAIL_DOMAIN,
  FAILED_OTPLOGIN_ATTEMPTS,
  LoginResponseCode,
  MAX_FAILED_OTP_ATTEMPTS,
  MAX_RESEND_MAIL_VERIFICATION_ATTEMPTS,
  OnBoardResponseCode,
  OnBoardSubscriptionTokenClaims,
  OnBoardTokenClaims,
  RESEND_MAIL_VERIFICATION_WINDOW_HOURS,
  ResendUpdatePasswordTokenClaims,
  ResendVerificationTokenClaims,
  TokenType,
  TotpTokenClaims,
  UNAUTHENTICATED_ERROR_MESSAGE,
  UpdatePasswordTokenClaims,
  UpdatePasswordType,
  VerifyEmailTokenClaims,
  nonSignupUserOrigins,
} from '../constants/authentication.constants';
import { UserNotFoundException } from '../../authorization/exception/user.exception';
import {
  GeneralApplicationException,
  generalError,
} from '../../../common/exception/general.application.exception';
import { ConfigService } from '@nestjs/config';
import StateNonce from '../../authorization/entity/state.nonce.entity';
import CountryService from '../../authorization/service/country.service';
import {
  Industry,
  UserOrganisationRole,
} from '../../authorization/constants/onboarding.constants';
import { UserLinkedAccountsService } from '../../authorization/service/userLinkedAccounts.service';
import { OrganisationMultiFactorAuthService } from '../../authorization/service/organisationMultiFactorAuth.service';
import UserLinkedAccounts from '../../authorization/entity/user.linked.accounts.entity';
import { SubscriptionService } from '../../subscription/service/subscription.service';
import { Transactional } from 'typeorm-transactional';
import { EnableLog } from '../../authorization/logging.decorator';
import { concatNames, splitName } from '../../../common/utils/string.utils';
import { AuthBlockchainService } from '../../../blockchain/service/auth.blockchain';
import {
  CreateTestUsersInput,
  LinkedAccountPlatform,
} from '../../../admin-interface/schema/graphql.schema';
import UserOrganisation from '../../authorization/entity/user.organisation.entity';
import UserOrganisationService from '../../authorization/service/user.organisation.service';
import OrganisationService from '../../authorization/service/organisation.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { RedisCacheService } from '../../../common/cache/redis-cache/redis-cache.service';
import UserCacheService from '../../authorization/service/usercache.service';
import { UserSirenService } from '../../siren/service/user.siren.service';
import { UserMailService } from '../../email/service/user.mail.service';
import { AuthenticationMixpanelService } from '../../mixpanel/service/authentication.mixpanel.service';
import {
  Origin,
  ResendEmailType,
} from '../../mixpanel/constants/mixpanel.constants';
import { UserMixpanelService } from '../../mixpanel/service/user.mixpanel.service';
import { CustomTransactional } from '../../../common/decorator/custom.transactional';
import {
  UserAndOrgSignupInput,
  UserSignupOutput,
} from '../types/userauth.types';
import { AccessTokenData } from '../../../core/authorization/constants/authorization.constants';
import { CountRangeResolver } from '../../../customer-interface/authentication/enum/count.range.enum';
import UserConsentService from '../../../core/authorization/service/user.consent.service';

@Injectable()
export default class UserauthService {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private authenticationHelper: AuthenticationHelper,
    @InjectRepository(UserRefreshToken)
    private userTokenRepository: Repository<UserRefreshToken>,
    @InjectRepository(StateNonce)
    private stateNonceRepository: Repository<StateNonce>,
    private organisationMultiFactorAuthService: OrganisationMultiFactorAuthService,
    private countryService: CountryService,
    private subscriptionService: SubscriptionService,
    private userLinkedAccountsService: UserLinkedAccountsService,
    private authBlockchain: AuthBlockchainService,
    private userOrganisationService: UserOrganisationService,
    private organisationService: OrganisationService,
    private loggerService: LoggerService,
    private cacheManager: RedisCacheService,
    private userCacheService: UserCacheService,
    private userSirenService: UserSirenService,
    private userMailService: UserMailService,
    private authenticationMixpanelService: AuthenticationMixpanelService,
    private userMixpanelService: UserMixpanelService,
    private userConsentService: UserConsentService,
  ) {}

  /**
   * To generate new refresh Token and remove existing refresh Token
   * @param refreshToken
   */
  @Transactional()
  async refresh(refreshToken: string): Promise<TokenResponse> {
    const response = this.authenticationHelper.validateAuthToken(
      refreshToken,
      TokenType.RefreshToken,
    );
    const userRecord: User | null =
      await this.userService.getUserDetailsForToken({ id: response.sub });
    if (!userRecord) throw new UserNotFoundException(response.sub);
    const userRefreshToken: UserRefreshToken | null =
      await this.userTokenRepository.findOneBy({
        id: response.refreshId,
        userId: response.sub,
      });
    if (
      !userRefreshToken ||
      !(await this.authenticationHelper.isPasswordValid(
        refreshToken,
        userRefreshToken.refreshToken,
      ))
    ) {
      throw new UnauthorizedException(UNAUTHENTICATED_ERROR_MESSAGE);
    }
    const userOrg = response.userOrgId
      ? await this.userOrganisationService.findOne({
          where: { id: response.userOrgId },
          relations: ['user', 'organisation'],
        })
      : undefined;
    const { refreshId, ...token } =
      this.authenticationHelper.generateTokenForUser(
        userRecord,
        response.userType,
        userOrg || undefined,
      );
    if (userRecord) {
      await this.addRefreshToken(
        refreshId,
        userRecord.id,
        token.refreshToken,
        this.userTokenRepository.manager,
      );
      await this.removeRefreshTokenById(
        response.refreshId,
        this.userTokenRepository.manager,
      );
    }
    return token;
  }

  /**
   * To add refresh token to UserRefreshToken entity
   * @param id
   * @param userId
   * @param refreshToken
   * @param entityManager
   */
  async addRefreshToken(
    id: string,
    userId: string,
    refreshToken: string,
    entityManager?: EntityManager,
  ) {
    const tokenRepo = entityManager
      ? entityManager.getRepository(UserRefreshToken)
      : this.userTokenRepository;
    const hashedToken = await this.authenticationHelper.generatePasswordHash(
      refreshToken,
    );
    const refreshTokenEntity = tokenRepo.create({
      id,
      userId,
      refreshToken: hashedToken,
    });

    await tokenRepo.save(refreshTokenEntity);
  }

  /**
   * To remove refresh token from UserRefreshToken entity
   * @param refreshToken string
   * @param entityManager EntityManager
   */
  async removeRefreshToken(
    refreshToken: string,
    entityManager?: EntityManager,
  ): Promise<void> {
    const response = this.authenticationHelper.validateAuthToken(
      refreshToken,
      TokenType.RefreshToken,
    );
    const tokenRepo = entityManager
      ? entityManager.getRepository(UserRefreshToken)
      : this.userTokenRepository;
    await tokenRepo.delete({ id: response.refreshId });
  }

  async removeRefreshTokenById(
    refreshId: string,
    entityManager?: EntityManager,
  ): Promise<void> {
    const tokenRepo = entityManager
      ? entityManager.getRepository(UserRefreshToken)
      : this.userTokenRepository;
    await tokenRepo.delete({ id: refreshId });
  }

  /**
   * Common login service for both customer and admin
   * @param input username and password
   * @param response response object - to set cookies
   * @param userType identify weather user or admin
   * @returns status with token
   */
  @Transactional()
  @CustomTransactional()
  public async login(
    input: UserLoginInput,
    response: Response,
    userType: UserType = UserType.Customer,
  ): Promise<AuthOutput> {
    const where: ObjectLiteral = { email: input.username };
    if (userType === UserType.Customer) where.isCustomer = true;
    else where.isAdmin = true;
    const user = await this.userService.getUserDetailsForToken(where);
    if (!user)
      throw new GeneralApplicationException(
        `User not found. Please try with different credentials`,
      );

    if (!user.password)
      throw new GeneralApplicationException(
        `The username or password is incorrect. Please try again`,
      );
    const isPassValid = await this.authenticationHelper.isPasswordValid(
      input.password,
      user.password,
    );
    if (!isPassValid)
      throw new GeneralApplicationException(
        `The username or password is incorrect. Please try again`,
      );
    let token;
    if (userType === UserType.Admin || user.isEmailVerified) {
      //Succesfully logined and the user is a verified user
      const authResponse = await this.checkOrgAuthentication(
        user,
        userType,
        true,
      );
      //If user has to go through mfa
      if (
        [
          LoginResponseCode.MFA_AUTH_REQUIRED.statusCode,
          LoginResponseCode.MFA_SETUP_REQUIRED.statusCode,
        ].includes(authResponse.statusCode)
      )
        return authResponse;
      await this.addtokenToResponse(response, authResponse.token, userType);
      await Promise.all([
        this.userMixpanelService.upsertUserProfile(user),
        this.authenticationMixpanelService.trackLogin(user, Origin.Native),
      ]);
      return {
        ...LoginResponseCode.LOGIN_SUCCESS,
        token: authResponse.token,
      };
    } else {
      const userOrgs = user.userOrganisation;
      const createdUserOrg = userOrgs.find(
        (item) => item.organisation.createdById === user.id,
      );
      const validOrg =
        createdUserOrg && (await this.isUserOrgValid(createdUserOrg));
      if (createdUserOrg && validOrg && validOrg.status === '1') {
        //password verified, but signup process incomplete.
        const signUpToken = await this.authenticationHelper.generateSignedJWT(
          {
            type: OnBoardingTokenType.Native,
            userOrgId: createdUserOrg.id,
          },
          TokenType.OnboardToken,
        );
        token = { accessToken: signUpToken };
        return { ...LoginResponseCode.LOGIN_ONBOARD_PENDING, token };
      } else {
        generalError('Your access to the organisation has been revoked');
      }
    }
  }

  /**
   * TODO - deprecated 'login()' can be removed later
   * Common login service for both customer and admin
   * @param input username and password
   * @param response response object - to set cookies
   * @param userType identify weather user or admin
   * @returns status with token
   */
  @Transactional()
  @CustomTransactional()
  public async userLogin(
    input: UserLoginInput,
    response: Response,
    userType: UserType = UserType.Customer,
  ): Promise<AuthOutput> {
    const where: FindOptionsWhere<User> = { email: input.username };
    if (userType === UserType.Customer) where.isCustomer = true;
    else where.isAdmin = true;
    const user = await this.userService.findOneOrFail(
      where,
      `User not found. Please try with different credentials`,
    );
    if (!user.password)
      throw new GeneralApplicationException(
        `The username or password is incorrect. Please try again`,
      );
    const isPassValid = await this.authenticationHelper.isPasswordValid(
      input.password,
      user.password,
    );
    if (!isPassValid)
      throw new GeneralApplicationException(
        `The username or password is incorrect. Please try again`,
      );
    if (userType === UserType.Admin || user.isEmailVerified) {
      //Succesfully logined and the user is a verified user
      const authResponse = await this.checkOrgAuthentication(
        user,
        userType,
        true,
        false,
      );
      //If user has to go through mfa
      if (
        [
          LoginResponseCode.MFA_AUTH_REQUIRED.statusCode,
          LoginResponseCode.MFA_SETUP_REQUIRED.statusCode,
        ].includes(authResponse.statusCode)
      )
        return authResponse;
      await this.addtokenToResponse(response, authResponse.token, userType);
      await Promise.all([
        this.userMixpanelService.upsertUserProfile(user),
        this.authenticationMixpanelService.trackLogin(user, Origin.Native),
      ]);
      return {
        ...authResponse,
        token: authResponse.token,
      };
    } else {
      // Customer user - password verification success, but not verified. Sending the verification link again.
      // Adding try catch since user may reach maximum attempt limit
      try {
        await this.sendEmailVerificationLink(user);
      } catch {}
      const resendEmailToken = await this.generateResendEmailToken(user);
      return {
        ...LoginResponseCode.VERIFICATION_PENDING,
        token: { accessToken: resendEmailToken },
      };
    }
  }

  /**
   * Get userlinked Account with TOTP platform
   * @param userId - UserId
   * @param organisationId - OrganisationId
   * @returns response object - User linked account
   */
  async getMfaAccount(userId: string, organisationId: string) {
    return await this.userLinkedAccountsService.findOne({
      where: {
        userId,
        organisationId,
        platform: LinkedAccountPlatform.TOTP,
        type: LinkedAccountType.Auth,
      },
    });
  }

  /**
   * Authenticate Totp
   * @param input otp
   * @param response response object - Auth output
   * @returns status with token
   */
  @EnableLog()
  public async authenticateTotp(
    input: AuthenticateTotpInput,
    response: Response,
  ): Promise<AuthOutput> {
    const payload: TotpTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        input.token,
        TokenType.MfaToken,
      );
    let failedOtpAttempts =
      ((await this.cacheManager.get(
        `${FAILED_OTPLOGIN_ATTEMPTS}-${payload.userId}-${payload.userOrgId}`,
      )) as number) || 1;
    failedOtpAttempts >= MAX_FAILED_OTP_ATTEMPTS &&
      generalError('Too many failed attemps. Please try again in 10 minutes.');
    const userLinkedAccount = await this.getMfaAccount(
      payload.userId,
      payload.userOrgId as string,
    );
    const totpSecret =
      userLinkedAccount?.uniqueid ||
      ((await this.cacheManager.get(
        `${payload.userId}-${payload.userOrgId}-totpSecret`,
      )) as string);
    const isOtpValid = speakeasy.totp.verify({
      secret: totpSecret,
      encoding: 'base32',
      token: input.otp,
      // Window is kept at 1 to consider the last invalidated TOTP as well
      window: 1,
    });
    if (isOtpValid) {
      const [userOrganisation, user] = await Promise.all([
        this.userOrganisationService.findOneOrFail({
          where: {
            userId: payload.userId,
            organisationId: payload.userOrgId,
          },
          relations: ['organisation'],
        }),
        this.userService.getUserDetailsForToken({
          id: payload.userId,
        }),
      ]);
      if (!user)
        throw new GeneralApplicationException(
          `User not found. Please try with different credentials`,
        );
      const authResponse = await this.checkOrgAuthentication(
        user,
        UserType.Customer,
        false,
        true,
        userOrganisation,
      );
      await this.userCacheService.invalidateUserGroupsCache(payload.userId);
      await this.addtokenToResponse(
        response,
        authResponse.token,
        UserType.Customer,
      );
      if (!userLinkedAccount) {
        const newLinkedAccountUser = {
          userId: payload.userId,
          organisationId: payload.userOrgId,
          platform: LinkedAccountPlatform.TOTP,
          type: LinkedAccountType.Auth,
          uniqueid: totpSecret,
        };
        await this.userLinkedAccountsService.save(newLinkedAccountUser);
        await this.cacheManager.del(
          `${payload.userId}-${payload.userOrgId}-totpSecret`,
        );
      }
      return {
        ...LoginResponseCode.LOGIN_SUCCESS,
        token: authResponse.token,
      };
    }
    await this.cacheManager.set(
      `${FAILED_OTPLOGIN_ATTEMPTS}-${payload.userId}-${payload.userOrgId}`,
      (failedOtpAttempts += 1),
      600, // 10mins
    );
    generalError('Invalid OTP');
  }

  /**
   * For user signup
   * @param input
   */
  @Transactional()
  @CustomTransactional()
  public async signup(input: UserSignupInput): Promise<AuthOutput> {
    const user = await this.userService.getUserByCondition(
      {
        email: input.email,
      },
      ['userOrganisation', 'userOrganisation.organisation'],
    );
    let newUser: User | undefined;
    const password = await this.authenticationHelper.generatePasswordHash(
      input.password,
    );
    if (user) {
      if (
        !(
          nonSignupUserOrigins.includes(user.origin as UserOrigin) &&
          user.password === null &&
          user.isEmailVerified === false &&
          user.userOrganisation.length <= 1
        )
      )
        throw new GeneralApplicationException(
          `An account already exists with this email id. Please Login`,
        );
      user.password = password;
      newUser = await this.userService.update(user);
    }
    newUser =
      newUser ||
      (await this.userService.createUser(
        {
          email: input.email,
          password,
          origin: UserOrigin.Signup,
        },
        input.planDetail as PlanDetail | undefined,
      ));
    if (!newUser)
      throw new GeneralApplicationException(
        `User is not able to create right now`,
      );
    const userOrg = newUser?.userOrganisation[0];
    const signUpTokenClaims: OnBoardTokenClaims = {
      type: OnBoardingTokenType.Native,
      userOrgId: userOrg.id,
    };
    const signUpToken = await this.authenticationHelper.generateSignedJWT(
      signUpTokenClaims,
      TokenType.OnboardToken,
    );
    const token = { accessToken: signUpToken };
    await Promise.all([
      this.userMixpanelService.upsertUserProfile(newUser),
      this.authenticationMixpanelService.trackSignUp(newUser, Origin.Native),
    ]);
    return {
      message: 'Signed up successfully',
      statusCode: 'SIGNUP-001',
      token,
    };
  }

  /**
   * resend email verification link
   * @param input
   * @returns
   */
  @Transactional()
  public async resendEmailVerification(
    claims: ResendVerificationTokenClaims,
  ): Promise<StatusResponse> {
    const user = await this.userService.findOneOrFail(claims.userId);
    if (user.isEmailVerified) {
      await this.handleResendEmailTracking(
        user,
        ResendEmailType.Verification,
        `Account is already verified. Please Login`,
      );
    }
    const res = await this.sendEmailVerificationLink(user);
    await this.handleResendEmailTracking(
      user,
      ResendEmailType.Verification,
      res.errorMessage,
    );
    return {
      message: 'Resending verfication mail successfull',
    };
  }

  /**
   * To handle the resend email verification and forgot password mixpanel tracking
   * @param user
   * @param resendType
   * @param errorMessage
   */
  public async handleResendEmailTracking(
    user: User,
    resendType: ResendEmailType,
    errorMessage?: string,
  ) {
    await this.authenticationMixpanelService.trackResendEmail(
      user,
      resendType,
      errorMessage,
    );
    if (errorMessage) {
      generalError(errorMessage);
    }
  }

  /**
   * user signup based on revamp
   * @param input
   * @returns
   */
  @Transactional()
  @CustomTransactional()
  public async userSignup(
    input: UserSignupInput,
    activateFreeTrial = false,
  ): Promise<UserSignupOutput> {
    const user = await this.userService.getUserByCondition({
      email: input.email,
    });
    let newUser: User | undefined;
    const password = await this.authenticationHelper.generatePasswordHash(
      input.password,
    );
    if (user) {
      if (
        !(
          nonSignupUserOrigins.includes(user.origin as UserOrigin) &&
          user.password === null &&
          user.isEmailVerified === false
        )
      )
        throw new GeneralApplicationException(
          `An account already exists with this email id. Please Login`,
        );
      user.password = password;
      newUser = await this.userService.update(user);
    }
    const { firstName, lastName } = splitName(input.name);
    newUser =
      newUser ||
      (await this.userService.createUserV2({
        firstName,
        lastName,
        email: input.email,
        password,
        origin: UserOrigin.Signup,
      }));
    if (!newUser)
      throw new GeneralApplicationException(
        `User is not able to create right now`,
      );
    await this.sendEmailVerificationLink(newUser, activateFreeTrial);
    const resendEmailToken = await this.generateResendEmailToken(newUser);
    await Promise.all([
      this.userMixpanelService.upsertUserProfile(newUser),
      this.authenticationMixpanelService.trackSignUp(newUser, Origin.Native),
    ]);
    return {
      message: 'Signed up successfully',
      statusCode: 'SIGNUP-001',
      token: { accessToken: resendEmailToken },
      user: newUser,
    };
  }

  /**
   * user signup based on revamp
   * @param input
   * @returns
   */
  @Transactional()
  @CustomTransactional()
  public async UserAndOrgSignUp(
    input: UserAndOrgSignupInput,
    response: Response,
  ): Promise<StatusResponse> {
    const { email, name, orgName, orgRole = '', orgSize, password } = input;
    const { user } = await this.userSignup({ email, name, password }, true);
    await this.organisationService.createOrganisation(
      user as unknown as AccessTokenData,
      {
        name: orgName,
        role: orgRole,
        employeeCount: orgSize as unknown as CountRange,
      },
      response,
    );
    return {
      message: 'user created successfully',
    };
  }

  /**
   * Generate resend email token for the user
   * @param user User
   * @returns Resend email token
   */
  async generateResendEmailToken(user: User): Promise<string> {
    const resendVerificationEmailClaims: ResendVerificationTokenClaims = {
      type: OnBoardingTokenType.Native,
      userId: user.id,
    };
    const resendEmailToken = await this.authenticationHelper.generateSignedJWT(
      resendVerificationEmailClaims,
      TokenType.ResendVerificationToken,
    );
    return resendEmailToken;
  }

  /**
   * Generate update password email token for the user
   * @param user User
   * @returns Resend email token
   */
  async generateUpdatePasswordEmailToken(user: User): Promise<string> {
    const updatePasswordEmailClaims: ResendUpdatePasswordTokenClaims = {
      type: UpdatePasswordType.forgotPassword,
      email: user.email,
    };
    const resendUpdatePasswordToken =
      await this.authenticationHelper.generateSignedJWT(
        updatePasswordEmailClaims,
        TokenType.ResendUpdatePasswordToken,
      );
    return resendUpdatePasswordToken;
  }

  /**
   * To send verification link to email with rate limiting
   * @param user User
   * @returns
   */
  @Transactional()
  public async sendEmailVerificationLink(
    user: User,
    activateFreeTrial = false,
  ) {
    const attemptCount =
      await this.userCacheService.getOrSetSendEmailVerificationAttemptsFromCache(
        user.id,
      );
    if (attemptCount > MAX_RESEND_MAIL_VERIFICATION_ATTEMPTS) {
      return {
        errorMessage: `Too many attemps. Please try after ${RESEND_MAIL_VERIFICATION_WINDOW_HOURS} hours.`,
      };
    }
    const verifyEmailClaims: VerifyEmailTokenClaims = {
      type: OnBoardingTokenType.Native,
      userId: user.id,
    };
    const emailToken = await this.authenticationHelper.generateSignedJWT(
      verifyEmailClaims,
      TokenType.VerifyEmailToken,
    );
    const verificationLink =
      await this.authenticationHelper.generateNativeSignUpVerificationLink(
        emailToken,
      );
    const userFullName =
      user.fullName || concatNames(user.firstName || '', user.lastName);
    return await this.userMailService.sendEmailVerificationMail(
      user.email,
      userFullName,
      `${verificationLink}${
        activateFreeTrial ? '&activateFreeTrial=true' : ''
      }`,
    );
  }

  /**
   * To send forgot password mail with rate limiting
   * @param user User
   * @returns
   */
  @Transactional()
  public async sendForgotPassword(user: User) {
    const attemptCount =
      await this.userCacheService.getOrSetSendForgotPasswordAttemptsFromCache(
        user.email,
      );
    if (attemptCount > MAX_RESEND_MAIL_VERIFICATION_ATTEMPTS) {
      return {
        errorMessage: `Too many attemps. Please try after ${RESEND_MAIL_VERIFICATION_WINDOW_HOURS} hours.`,
      };
    }
    const updatePasswordTokenClaims: UpdatePasswordTokenClaims = {
      email: user.email,
      type: UpdatePasswordType.forgotPassword,
    };
    const token = await this.authenticationHelper.generateSignedJWT(
      updatePasswordTokenClaims,
      TokenType.UpdatePasswordToken,
    );
    const userFullName =
      user.fullName || concatNames(user.firstName || '', user.lastName);
    return await this.userMailService.sendUserForgotPasswordMail(
      userFullName,
      user.email,
      token,
    );
  }

  /**
   * To get details for onboarding page
   * @param token token with email and type as claims
   * @returns details for onboarding page
   */
  @EnableLog()
  public async getOnBoardingBaseDetails(token: string) {
    const payload: OnBoardTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.OnboardToken,
      );
    const countries = await this.countryService.getCountries();
    const industries = Object.values(Industry);
    const userOrganisationRoles = Object.values(UserOrganisationRole);
    //Default values for the onboarding page
    const out: OnBoardingDetails = {
      signUpType: payload.type,
      countries,
      industries,
      userOrganisationRoles,
    };
    //For Google and Native signup-token will have email in claims(payload).
    if (payload.type !== OnBoardingTokenType.Singpass) {
      const userOrg = await this.userOrganisationService.findOneOrFail({
        where: { id: payload.userOrgId },
        relations: ['user', 'organisation'],
      });
      out.individualDetails = {
        countryId: userOrg.user.countryId,
        email: userOrg.user.email,
        firstName: userOrg.user.firstName,
        lastName: userOrg.user.lastName,
      };
      out.organisationDetails = {
        countryId: userOrg.user.countryId,
        industry: userOrg.organisation.industry,
        legalName: userOrg.organisation.name,
        role: userOrg.role,
      };
    }
    return out;
  }

  /**
   * To get subscription details for checkout after onboard
   * @param token
   */
  @EnableLog()
  async getOnBoardSubscriptionDetails(token: string) {
    const claims: OnBoardSubscriptionTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.OnBoardSubscriptionToken,
      );

    return await this.subscriptionService.findFutureSubscription(claims.orgId);
  }

  /**
   * To get qr code for totp mfa auth
   * @param token
   * @param response Response
   */
  @EnableLog()
  async getTotpQr(token: string): Promise<TotpQrOutput> {
    const payload: TotpTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.MfaToken,
      );
    const userLinkedAccount = await this.getMfaAccount(
      payload.userId,
      payload.userOrgId as string,
    );
    userLinkedAccount && generalError('User has already set up MFA');
    const userOrganisation = await this.organisationService.findOneOrFail({
      id: payload.userOrgId,
    });
    const totpSecret = speakeasy.generateSecret({
      name: `ContractLoom (${userOrganisation.name})`,
    });
    const qrImageUrl = await QRCode.toDataURL(totpSecret.otpauth_url as string);
    await this.cacheManager.set(
      `${payload.userId}-${payload.userOrgId}-totpSecret`,
      totpSecret.base32,
    );
    return {
      ...LoginResponseCode.MFA_SETUP_REQUIRED,
      qrImageUrl,
    };
  }

  /**
   * To get the Organisation details from the MFA token
   * @param token
   * @returns MFAOrgDetailsOutput
   */
  @EnableLog()
  async getOrgDetailsFromMFAToken(token: string): Promise<MFAOrgDetailsOutput> {
    const payload: TotpTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.MfaToken,
      );
    const userOrganisation = await this.organisationService.findOneOrFail({
      id: payload.userOrgId,
    });
    return {
      organisationName: userOrganisation.name || '',
    };
  }

  /**
   * For on-boarding user
   * @param input input for onboarding
   * @param response Response
   */
  @Transactional()
  @EnableLog()
  public async onBoard(
    input: OnBoardInput,
    response?: Response,
  ): Promise<AuthOutput> {
    /* 
    claims: { email/entryId, type }
    For Native and Google onboarding, 'email' will be in claims,
    whereas for Singpass it will be 'entryId'(corresponding to UserLinkedAccount entry) instead.
    claims.type : OnBoardingTokenType
    */
    const claims: OnBoardTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        input.token,
        TokenType.OnboardToken,
      );
    let userOrg: UserOrganisation;
    let user: User;
    let email: string | undefined;
    if (claims.type === OnBoardingTokenType.Singpass) {
      email =
        input.individualDetails?.email || input.organisationDetails?.email;
      const userLinkedAccountEntry =
        await this.userLinkedAccountsService.findOne({
          where: {
            id: claims.entryId,
            platform: LinkedAccountPlatform.Singpass,
          },
        });
      if (!userLinkedAccountEntry || userLinkedAccountEntry?.userId || !email) {
        throw new GeneralApplicationException(
          'Something went wrong during Singpass login! Please try again',
        );
      }
      const planDetail =
        claims.state &&
        (await this.stateNonceRepository.findOneBy({ state: claims.state }))
          ?.data?.planDetail;
      const existingUser = await this.userService.getUserByCondition({ email });
      if (existingUser) {
        throw new GeneralApplicationException(
          'User with given email already exists',
        );
      }
      user = await this.userService.createUser(
        {
          email,
          origin: UserOrigin.Singpass,
        },
        planDetail,
      );
      userOrg = user.userOrganisation[0];
      if (!user) {
        throw new GeneralApplicationException('Unable to create User');
      }
    } else {
      userOrg = await this.userOrganisationService.findOneOrFail({
        where: { id: claims.userOrgId },
        relations: ['user', 'organisation'],
      });
      user = userOrg.user;
    }
    if (user.isEmailVerified)
      throw new GeneralApplicationException(
        'Email is already verified! Please login.',
      );
    if (input.type === OnBoardingType.Individual) {
      user.firstName = input.individualDetails?.firstName;
      user.lastName = input.individualDetails?.lastName || undefined;
      user.countryId = input.individualDetails?.countryId;
      userOrg.organisation.countryId = input.individualDetails?.countryId;
      userOrg.organisation.origin = OrganisationOrigin.Application;
      userOrg.organisation.name = input.individualDetails?.legalName;
      userOrg.organisation.email = user.email;
    }
    //TODO: update this when implementing multiple organisation for a single user.
    if (input.type === OnBoardingType.Organisation) {
      user.firstName = input.organisationDetails?.firstName;
      user.lastName = input.organisationDetails?.lastName || undefined;
      user.countryId = input.individualDetails?.countryId;
      userOrg.organisation.name = input.organisationDetails?.legalName;
      userOrg.organisation.industry =
        input.organisationDetails?.industry || undefined;
      userOrg.role = input.organisationDetails?.role || undefined;
      userOrg.organisation.countryId = input.organisationDetails?.countryId;
      userOrg.organisation.origin = OrganisationOrigin.Signup;
      userOrg.organisation.email = input.organisationDetails?.email;
    }
    claims.type === OnBoardingTokenType.Google && (user.isEmailVerified = true);
    userOrg = await this.userOrganisationService.saveUserOrganisation(userOrg);
    user = await this.userService.update(user);
    await this.authBlockchain.updateUser({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    });
    const futureSubscription =
      await this.subscriptionService.findFutureSubscription(
        userOrg.organisation.id,
      );
    if (futureSubscription?.subscriptionMode === SubscriptionMode.Trial) {
      try {
        await this.subscriptionService.subscribeTrialPlan(
          {
            planName: futureSubscription.planItem.externalId,
            quantity: 1,
          },
          userOrg.organisation.id,
        );
      } catch (error) {
        this.loggerService.error('Error on creating trial plan');
      }
    }
    const isPaidSubscription =
      futureSubscription?.subscriptionMode === SubscriptionMode.Paid;
    // In case of google auth, need to redirect user to dashboard
    // Here setting the auth tokens to response
    if (claims.type === OnBoardingTokenType.Google) {
      const googleUser = await this.userService.getUserDetailsForToken({
        id: user.id,
      });
      const authResponse = await this.checkOrgAuthentication(
        googleUser as User,
      );
      response &&
        (response = await this.addtokenToResponse(
          response,
          authResponse.token,
        ));
      if (!isPaidSubscription) {
        return {
          ...OnBoardResponseCode.ONBOARD_GOOGLE_SUCCESS,
          token: authResponse.token,
        };
      }
    } else {
      // email verification link is sending to the user
      const verifyEmailClaims: VerifyEmailTokenClaims = {
        type: claims.type,
        userOrgId: userOrg.id,
      };
      claims.type === OnBoardingTokenType.Singpass &&
        (verifyEmailClaims.entryId = claims.entryId);
      const emailToken = await this.authenticationHelper.generateSignedJWT(
        verifyEmailClaims,
        TokenType.VerifyEmailToken,
      );
      const verificationLink =
        await this.authenticationHelper.generateNativeSignUpVerificationLink(
          emailToken,
        );
      const userFullName =
        user.fullName || concatNames(user.firstName || '', user.lastName);
      await this.userSirenService.sendUserEmailVerificationMail(
        user.email,
        userFullName,
        verificationLink,
      );
    }
    const onBoardSubscriptionTokenClaims: OnBoardSubscriptionTokenClaims = {
      orgId: userOrg.organisation.id,
    };
    const onBoardToken = await this.authenticationHelper.generateSignedJWT(
      onBoardSubscriptionTokenClaims,
      TokenType.OnBoardSubscriptionToken,
    );
    if (isPaidSubscription) {
      return {
        ...(claims.type === OnBoardingTokenType.Google
          ? OnBoardResponseCode.ONBOARD_BILLING_DASHBOARD
          : OnBoardResponseCode.ONBOARD_BILLING_EMAIL_VERIFICATION),
        token: { accessToken: onBoardToken },
      };
    } else {
      return {
        ...OnBoardResponseCode.ONBOARD_VERIFY_EMAIL,
        token: { accessToken: onBoardToken },
      };
    }
  }

  /**
   * To verify email in the on boarding flow.
   * @param token token with claims:email, type and token type
   */
  @Transactional()
  @EnableLog()
  public async verifyEmail(token: string) {
    const claims: VerifyEmailTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.VerifyEmailToken,
      );
    let user: User | undefined;
    if (claims.userOrgId) {
      const userOrg = await this.userOrganisationService.findOneOrFail({
        where: { id: claims.userOrgId },
        relations: ['user'],
      });
      user = userOrg?.user;
      if (claims.type === OnBoardingTokenType.Singpass) {
        let userLinkedAccountEntry =
          await this.userLinkedAccountsService.findOne({
            where: {
              id: claims.entryId,
              platform: LinkedAccountPlatform.Singpass,
            },
          });
        if (!userLinkedAccountEntry) {
          throw new EntityNotFoundError(UserLinkedAccounts, {
            id: claims.entryId,
          });
        }
        if (userLinkedAccountEntry.isLinkVerified) {
          return {
            action: 'redirectToLogin',
            message: 'User email is already verified. Please Login',
          };
        }
        userLinkedAccountEntry = {
          ...userLinkedAccountEntry,
          isLinkVerified: true,
          userId: user.id,
          organisationId: userOrg.organisationId,
        };
        await this.userLinkedAccountsService.save(userLinkedAccountEntry);
      }
    } else if (claims.userId) {
      user = await this.userService.findOneOrFail({
        where: { id: claims.userId },
      });
    }
    if (!user) throw new GeneralApplicationException('User not found');
    if (user.isEmailVerified)
      return {
        action: 'redirectToLogin',
        message: 'User email is already verified. Please Login',
      };
    user.isEmailVerified = true;
    claims.userOrgId && (await this.isOkForVerify(user));
    await this.userService.update(user);
    await this.userConsentService.addUserConsent(user.id);
    return {
      action: 'redirectToLogin',
      message: 'Email verified successfully',
    };
  }

  /** Function to verify user data before allowing to login
   * @param user - User Object
   */
  @Transactional()
  async isOkForVerify(user: User) {
    const userOrgs =
      user.userOrganisation ||
      (await this.userOrganisationService.find({
        where: { userId: user.id },
        relations: ['organisation'],
      }));
    await Promise.all(
      userOrgs.map(async (item) => {
        !item.organisation.name &&
          (await this.organisationService.update(item.organisation.id, {
            name: 'Individual Account',
            email: user.email,
          }));
      }),
    );
  }

  /**
   * TODO: funtion is currently used for both user snd org authentication.can be renamed to checkAuthentication
   * Function to generate token response or access token
   *  If MFA is enabled, function will return object containing MFA status code and totp token
   *  If MFA is not enabled, function will add refresh token to db and return object containing access token and refresh token
   * @param user - User Object
   * @returns TokenResponse object
   */
  @Transactional()
  async checkOrgAuthentication(
    user: User,
    userType: UserType = UserType.Customer,
    performMfaCheck = false,
    errorOnNoOrg = true,
    userOrganisation?: UserOrganisation,
  ): Promise<AuthOutput> {
    if (userOrganisation) {
      const { status, message } = await this.isUserOrgValid(userOrganisation);
      status !== '1' && generalError(message);
    } else {
      userOrganisation = await this.getLastActiveUserOrganisation(
        user,
        errorOnNoOrg,
      );
    }
    if (userType === UserType.Customer && userOrganisation) {
      if (performMfaCheck) {
        const isMfaEnabled =
          (
            await this.organisationMultiFactorAuthService.findOne({
              organisationId: userOrganisation.organisationId,
            })
          )?.isMfaEnabled || false;
        if (isMfaEnabled) {
          const userLinkedAccount = await this.getMfaAccount(
            user.id,
            userOrganisation.organisationId,
          );
          const totpAuthToken =
            await this.authenticationHelper.generateSignedJWT(
              { userId: user.id, userOrgId: userOrganisation.organisationId },
              TokenType.MfaToken,
            );
          return {
            ...(userLinkedAccount
              ? LoginResponseCode.MFA_AUTH_REQUIRED
              : LoginResponseCode.MFA_SETUP_REQUIRED),
            token: { accessToken: totpAuthToken },
          };
        }
      }
      await this.setDefaultOrganisation(user, userOrganisation);
    }
    const { refreshId, ...token } =
      this.authenticationHelper.generateTokenForUser(
        user,
        userType,
        userOrganisation,
      );
    await this.addRefreshToken(refreshId, user.id, token.refreshToken);
    return {
      token,
      ...LoginResponseCode.LOGIN_SUCCESS,
    };
  }

  /** Function to set default organisation of user
   * @param user - User Object
   * @param userOrg - User organisation Object
   */
  @Transactional()
  async setDefaultOrganisation(user: User, userOrg: UserOrganisation) {
    user.defaultOrganisationId !== userOrg.organisationId &&
      (user.defaultOrganisationId = userOrg.organisationId) &&
      (await this.userService.update(user));
  }

  /**
   * function to check if a user organisation is active or not
   * @param userOrg - user organisation object
   * @returns number
   */
  @Transactional()
  async isUserOrgValid(
    userOrg: UserOrganisation,
  ): Promise<Record<string, string>> {
    const isValid =
      userOrg?.status === UserOrganisationStatus.Active
        ? { status: '1', message: 'The account is active in this organisation' }
        : {
            status: '0',
            message: 'Your account is Inactive in this organisation',
          };
    return isValid;
  }

  /**
   * function to get the last active organisation that user is logged into, if not valid it will return next active organisation
   * @param user - user object
   * @returns userOrganisation | undefined
   */
  @Transactional()
  async getLastActiveUserOrganisation(
    user: User,
    errorOnNoOrg = true,
  ): Promise<UserOrganisation | undefined> {
    let isValid: Record<string, string> = {
      status: '',
      message: '',
    };
    const userOrgs =
      user.userOrganisation ||
      (await this.userOrganisationService.find({
        relations: ['organisation'],
        where: { userId: user.id },
      }));
    const defaultUserOrg =
      user.defaultOrganisationId &&
      userOrgs.find(
        (item) => item.organisationId === user.defaultOrganisationId,
      );
    if (defaultUserOrg) {
      isValid = await this.isUserOrgValid(defaultUserOrg);
      if (isValid.status === '1') return defaultUserOrg;
    }
    const createdUserOrg = userOrgs.find(
      (item) => item.organisation.createdById === user.id,
    );
    const validOrg =
      createdUserOrg && (await this.isUserOrgValid(createdUserOrg));
    if (createdUserOrg && validOrg?.status === '1') {
      return createdUserOrg;
    }
    for (const userOrg of userOrgs) {
      isValid = await this.isUserOrgValid(userOrg);
      if (isValid.status === '1') {
        return userOrg;
      }
    }
    // if user is part of any organization, the control will already be returned before reaching this point
    if (errorOnNoOrg)
      throw new GeneralApplicationException(
        isValid.message || 'Your account is Inactive in this organisation',
      );
    return undefined;
  }

  @Transactional()
  @EnableLog()
  async getStateAndNonce(planDetail?: PlanDetail): Promise<StateNonce> {
    const stateNonce = { state: uuid(), nonce: uuid() } as StateNonce;
    planDetail && (stateNonce.data = { version: 'v1.0', planDetail });
    this.stateNonceRepository.save(stateNonce);
    return stateNonce;
  }

  /**
   * Function to set access token and refresh token to https response object
   * @param response - Https response object to verify
   * @param token - token created against the user
   * @param userType
   * @param tokenType
   * @returns Https response object
   */
  async addtokenToResponse(
    response: Response,
    token: TokenResponse,
    userType: UserType = UserType.Customer,
    tokenType: TokenType = TokenType.AccessToken,
  ): Promise<Response> {
    const cookieOptions: CookieOptions = await this.getCookieOptions();
    response.cookie(
      this.authenticationHelper.getAccessTokenCookieName(userType, tokenType),
      token.accessToken,
      cookieOptions,
    );
    token.refreshToken &&
      response.cookie(
        this.authenticationHelper.getRefreshTokenCookieName(userType),
        token.refreshToken,
        cookieOptions,
      );
    return response;
  }

  /** Function to remove access token and refresh token from cookies in an https response object
   * @param response - Https response object to beverify
   * @param refreshToken - refresh token to be removed
   * @returns Https response object
   */
  @Transactional()
  @CustomTransactional()
  async removeTokenFromResponse(
    response: Response,
    request: Request,
    refreshTokenInput: string | undefined,
    userType: UserType = UserType.Customer,
  ): Promise<Response> {
    const token = await this.authenticationHelper.extractTokenFromRequest(
      request,
      userType,
      TokenType.AccessToken,
    );
    if (!token) {
      throw new UnauthorizedException('Access token not found');
    }
    const { username } = await this.authenticationHelper.verifySignedJWT(
      token,
      TokenType.AccessToken,
      true,
    );
    const cookieOptions: CookieOptions = await this.getCookieOptions();
    const refreshToken =
      request.signedCookies?.[
        this.authenticationHelper.getRefreshTokenCookieName(userType)
      ] || refreshTokenInput;

    response.clearCookie(
      this.authenticationHelper.getRefreshTokenCookieName(userType),
      cookieOptions,
    );
    response.clearCookie(
      this.authenticationHelper.getAccessTokenCookieName(userType),
      cookieOptions,
    );
    refreshToken && (await this.removeRefreshToken(refreshToken));
    this.authenticationMixpanelService.trackLogout({ id: username } as User);
    return response;
  }

  async getCookieOptions(): Promise<CookieOptions> {
    const CookieOptions: CookieOptions = {
      httpOnly: true,
      signed: true,
      domain: ALLOWED_MAIL_DOMAIN,
      secure: this.configService.get('ENV') !== 'local',
      // sameSite need to be none in order to work from 'localhost FE' to 'https BE'
      sameSite: this.configService.get('ENV') == 'develop' ? 'none' : 'strict',
    };
    return CookieOptions;
  }

  /**
   * Create test users.
   * @param input
   * @returns List of Users
   */
  @Transactional()
  async createTestUsers(input: CreateTestUsersInput) {
    const baseEmailName = 'qascribezero';
    const baseDomain = 'gmail.com';
    const password = await this.authenticationHelper.generatePasswordHash(
      'Test@123',
    );
    const users: User[] = [];
    for (let i = input.startIndex || 100, count = 0; count < input.count; i++) {
      const email = `${baseEmailName}+${i}@${baseDomain}`;
      const existingUser = await this.userService.getUserByCondition({
        email,
      });
      if (existingUser) {
        continue;
      }
      const user = await this.userService.createUser({
        email,
        password,
        firstName: `${baseEmailName}+${i}`,
        lastName: `Tester${i}`,
        origin: UserOrigin.Signup,
        isEmailVerfied: true,
        isActive: true,
      });
      if (!user) {
        this.loggerService.error(`User creation failed for ${email} `);
        continue;
      }
      users.push(user);
      count++;
    }
    return users;
  }

  /**
   * To verify mail on forgot Password condition and send Forgot Password mail
   * @param userEmail
   */
  @EnableLog()
  @Transactional()
  @CustomTransactional()
  public async forgotPassword(userEmail: string) {
    const userExists = await this.userService.findOneOrFail(
      {
        where: { email: userEmail, isCustomer: true },
      },
      'The email address that you have entered does not match any account. Recheck the email address or Sign up for an account',
    );
    const res = await this.sendForgotPassword(userExists);
    const resendEmailToken = await this.generateUpdatePasswordEmailToken(
      userExists,
    );
    await this.authenticationMixpanelService.trackForgotPassword(
      userExists,
      res.errorMessage,
    );
    if (res.errorMessage) {
      generalError(res.errorMessage);
    }
    return {
      message: 'Email sent successfully',
      token: { accessToken: resendEmailToken },
    };
  }

  /**
   * To update password to a new one
   * @param password
   * @param token
   */
  @Transactional()
  @CustomTransactional()
  public async updatePassword(password: string, token: string) {
    const payload: UpdatePasswordTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.UpdatePasswordToken,
      );
    const userExists = await this.userService.findOneOrFail({
      where: { email: payload.email, isCustomer: true },
    });
    userExists.password = await this.authenticationHelper.generatePasswordHash(
      password,
    );
    if (payload.type === UpdatePasswordType.userAddedToOrganisation) {
      // Need modification when accept reject flow came - Modify status only if current status is Invited else throw some error.
      const userOrgEntry = await this.userOrganisationService.findOneOrFail({
        where: { id: payload.userOrgId },
      });
      userOrgEntry.inviteStatus = InviteStatus.Accepted;
      userExists.isEmailVerified = true;
      userExists.defaultOrganisationId = userOrgEntry.organisationId;
      await this.isOkForVerify(userExists);
      await this.userOrganisationService.saveUserOrganisation(userOrgEntry);
      await this.userConsentService.addUserConsent(userExists.id);
    }
    await this.userService.save(userExists);
    await this.authenticationMixpanelService.trackNewPasswordConfirm(
      userExists,
    );
    return {
      message: 'Password Updated',
    };
  }

  /**
   * resend forgot password mail
   * @param input
   * @returns
   */
  public async resendForgotPassword(
    claims: ResendUpdatePasswordTokenClaims,
  ): Promise<StatusResponse> {
    const user = await this.userService.findOneOrFail({
      where: { email: claims.email },
    });
    const res = await this.sendForgotPassword(user);
    await this.handleResendEmailTracking(
      user,
      ResendEmailType.ForgotPassword,
      res.errorMessage,
    );
    return {
      message: 'Resending forgot password mail successfully',
    };
  }
}
