import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  AuthOutput,
  AuthenticateTotpInput,
  MFAOrgDetailsOutput,
  OnBoardInput,
  PlanDetail,
  RefreshTokenInput,
  StatusResponse,
  TokenResponse,
  TotpQrOutput,
  UpdatePasswordInput,
  UserLoginInput,
  UserSignupInput,
  UserType,
} from '../../schema/graphql.schema';
import UserauthService from '../../../core/authentication/service/userauth.service';
import { Request, Response } from 'express';
import { validate } from '../../../common/utils/validation.utils';
import {
  ForgotPasswordInputValidation,
  OnBoardInputValidation,
  UpdatePasswordInputValidation,
  UserLoginInputValidation,
  SignupInputValidation,
  UserSignupInputValidation,
} from '../../../core/authentication/validation/userauthschema.validation';
import StateNonce from '../../../core/authorization/entity/state.nonce.entity';
import UserService from '../../../core/authorization/service/user.service';
import {
  ResendUpdatePasswordTokenClaims,
  ResendVerificationTokenClaims,
  TokenType,
} from '../../../core/authentication/constants/authentication.constants';
import { UseTokenGuard } from '../../../core/authentication/token.decarator';

@Resolver('Userauth')
export default class UserauthResolver {
  constructor(
    private readonly userauthService: UserauthService,
    private readonly userService: UserService,
  ) {}

  @Mutation('refresh')
  async refresh(
    @Args('input') request: RefreshTokenInput,
  ): Promise<TokenResponse> {
    return this.userauthService.refresh(request.refreshToken);
  }

  @Mutation('logout')
  async logout(
    @Context('req') request: Request,
    @Context('res') response: Response,
    @Args('input') input?: RefreshTokenInput,
  ): Promise<string> {
    await this.userauthService.removeTokenFromResponse(
      response,
      request,
      input?.refreshToken,
      UserType.Customer,
    );
    return 'success';
  }

  @Mutation('login')
  async login(
    @Context('res') response: Response,
    @Args('input') input: UserLoginInput,
  ): Promise<AuthOutput> {
    input = await validate(UserLoginInputValidation, input);
    const resp = await this.userauthService.login(input, response);
    return resp;
  }

  @Mutation()
  async userLogin(
    @Context('res') response: Response,
    @Args('input') input: UserLoginInput,
  ): Promise<AuthOutput> {
    input = await validate(UserLoginInputValidation, input);
    const resp = await this.userauthService.userLogin(input, response);
    return resp;
  }

  @Mutation()
  async authenticateTotp(
    @Context('res') response: Response,
    @Args('input') input: AuthenticateTotpInput,
  ): Promise<AuthOutput> {
    return await this.userauthService.authenticateTotp(input, response);
  }

  @Mutation()
  @UseTokenGuard(TokenType.ResendVerificationToken)
  async resendEmailVerification(
    @Context('user') user: ResendVerificationTokenClaims,
  ): Promise<StatusResponse> {
    const resp = await this.userauthService.resendEmailVerification(user);
    return resp;
  }

  @Mutation()
  @UseTokenGuard(TokenType.ResendUpdatePasswordToken)
  async resendForgotPassword(
    @Context('user') user: ResendUpdatePasswordTokenClaims,
  ): Promise<StatusResponse> {
    const resp = await this.userauthService.resendForgotPassword(user);
    return resp;
  }

  @Mutation('signup')
  async signup(@Args('input') input: UserSignupInput): Promise<AuthOutput> {
    input = await validate(SignupInputValidation, input);
    const resp = await this.userauthService.signup(input);
    return resp;
  }

  @Mutation()
  async userSignup(@Args('input') input: UserSignupInput): Promise<AuthOutput> {
    input = await validate(UserSignupInputValidation, input);
    const resp = await this.userauthService.userSignup(input);
    return resp;
  }

  @Mutation()
  async onBoard(
    @Args('input') input: OnBoardInput,
    @Context('res') response: Response,
  ) {
    input = await validate(OnBoardInputValidation, input);
    const res = await this.userauthService.onBoard(input, response);
    return res;
  }

  @Query('getStateAndNonce')
  async getStateAndNonce(
    @Args('planDetail') planDetail: PlanDetail,
  ): Promise<StateNonce> {
    const resp = await this.userauthService.getStateAndNonce(planDetail);
    return resp;
  }

  @Mutation()
  async forgotPassword(@Args('email') email: string) {
    email = (await validate(ForgotPasswordInputValidation, { email })).email;
    return await this.userauthService.forgotPassword(email);
  }

  @Mutation()
  async updatePassword(@Args('input') input: UpdatePasswordInput) {
    input = await validate(UpdatePasswordInputValidation, input);
    return await this.userauthService.updatePassword(
      input.password,
      input.token,
    );
  }

  @Query()
  async getTotpQr(@Args('token') token: string): Promise<TotpQrOutput> {
    return await this.userauthService.getTotpQr(token);
  }

  @Query()
  async getOrgDetailsFromMFAToken(
    @Args('token') token: string,
  ): Promise<MFAOrgDetailsOutput> {
    return await this.userauthService.getOrgDetailsFromMFAToken(token);
  }

  @Query()
  async getOnBoardingBaseDetails(@Args('token') token: string) {
    return await this.userauthService.getOnBoardingBaseDetails(token);
  }

  @Query()
  async getOnBoardSubscriptionDetails(@Args('token') token: string) {
    return await this.userauthService.getOnBoardSubscriptionDetails(token);
  }

  @Mutation()
  async sendResetMfaMail(
    @Args('token') token: string,
  ): Promise<StatusResponse> {
    return await this.userService.sendResetMfaMail(token);
  }
}
