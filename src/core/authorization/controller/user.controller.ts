import { Body, Controller, Post, Res, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import UserService from '../service/user.service';

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
      await this.userService.login(input, response);
      return response.status(200).json({ message: 'Logined successfully' });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
