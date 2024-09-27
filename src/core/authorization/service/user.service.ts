import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { ObjectLiteral, Repository } from 'typeorm';
import User from '../entity/user.entity';
import { GeneralApplicationException } from '../../../common/exception/general.application.exception';
import { Transactional } from 'typeorm-transactional';
import { BaseService } from 'src/common/utils/base.service';
import { AuthenticationHelper } from './authentication.helper';

@Injectable()
export default class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private authenticationHelper: AuthenticationHelper,
  ) {
    super(userRepo);
  }

  @Transactional()
  public async login(input: any, response: Response) {
    const where: ObjectLiteral = { email: input.email };
    const user = await this.findOneOrFail(where);
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
    //Succesfully logined and the user is a verified user
    const token = await this.authenticationHelper.generateSignedJWT({
      userId: user.id,
    });
    // await this.addtokenToResponse(response, authResponse.token, userType);
    return {
      token,
    };
  }
}
