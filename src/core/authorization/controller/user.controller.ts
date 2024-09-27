import { Body, Controller, Post, Res, UseInterceptors, Get, Req } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import UserService from '../service/user.service';
import { AuthUser } from '../authorization.constants';
import { UseAuthGuard } from '../authentication.decarator';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('login')
  @UseInterceptors(AnyFilesInterceptor())
  async login(
    @Body() input: { email: string; password: string },
    @Res() response: Response,
  ) {
    try {
      const resp = await this.userService.login(input, response);
      return response.status(200).json(resp);
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @UseAuthGuard()
  @Get('profile')
  async getUser(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    //@ts-ignore
    const user = request.user as AuthUser;
    const userobj = await this.userService.findOneOrFail(user.id);
    return response.status(200).json(userobj);
  }
}

