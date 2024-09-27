import { Body, Controller, Post, Res, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as multer from 'multer';
import UserauthService from '../../../core/authentication/service/userauth.service';
import { UserAndOrgSignUpSchema } from '../../../core/authorization/validation/user.validation.schema';
import { validate } from '../../../common/utils/validation.utils';
import { UserAndOrgSignupInput } from '../../../core/authentication/types/userauth.types';

@Controller('user-auth')
export class UserAuthController {
  constructor(private userAuthService: UserauthService) {}

  @Post('signup-withorg')
  @UseInterceptors(AnyFilesInterceptor({ storage: multer.memoryStorage() }))
  async UserAndOrgSignUp(
    @Body() input: UserAndOrgSignupInput,
    @Res() response: Response,
  ) {
    try {
      const data = await validate(UserAndOrgSignUpSchema, input);
      await this.userAuthService.UserAndOrgSignUp(data, response);
      return response
        .status(200)
        .json({ message: 'user signed up successfully' });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
