import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import User from '../entity/user.entity';
import { BaseService } from 'src/common/utils/base.service';
import {
  EntityManager,
  FindOneOptions,
  FindOptionsWhere,
  IsNull,
  Not,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { UserNotFoundException } from '../exception/user.exception';
import { CookieOptions, Response } from 'express';
import { GeneralApplicationException } from '../../../common/exception/general.application.exception';
import { Transactional } from 'typeorm-transactional';
import { AuthenticationHelper } from './authentication.helper';
import { AssessmentService } from 'src/core/classroom/service/assessment.service';

@Injectable()
export default class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private assessmentService: AssessmentService,
    private authenticationHelper: AuthenticationHelper,
  ) {
    super(usersRepository);
  }

  /**
   * To get a User by id
   * @param id
   * @param entityManager
   * @returns User
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['createdGrades'],
    });
    if (user) {
      const avgScore = await this.assessmentService.getAverageScore(id, null);
      return { ...user, avgScore };
    }
    throw new UserNotFoundException(id);
  }

  /**
   * Finds a user using the given conditions.
   * Throws the given error message if not found.
   * @param queryObj query object to  find the user
   * @returns User
   */

  async findOne(queryObj: FindOneOptions<User>): Promise<User | null> {
    return await this.usersRepository.findOne(queryObj);
  }

  /**
   * Find one user using given conditions
   * @param query
   * @param errorMessage message to throw in error
   * @returns User
   */
  async findOneOrFail(
    query: ObjectLiteral | FindOneOptions<User> | string,
    errorMessage?: string,
  ): Promise<User> {
    return await super.findOneOrFail(query, errorMessage);
  }

  /**
   * Function to save the user or list of users
   * @param user
   */
  public async save(user: User | User[]): Promise<User | User[]> {
    const out = await this.usersRepository.save(
      Array.isArray(user) ? user : [user],
    );
    return Array.isArray(user) ? out : out[0];
  }

  /**
   * Dedicated function to get user profile details from token
   * @param id primary key of user entity
   * @returns user profile
   */
  async getUserProfile(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (user) {
      return user;
    }
    throw new UserNotFoundException(id);
  }

  /**
   * Get user by given condition.
   * @param where Condition against user table
   * @param relations Relations to be fetched
   * @returns user object or undefined
   */
  async getUserByCondition(
    where: FindOptionsWhere<User>,
    relations?: string[],
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      where,
      relations,
    });
  }

  /**
   * function to get or create an user
   * @param user user object
   * @returns user object
   * @throws UserNotFoundException
   */
  async getOrCreateUser(user: User): Promise<User> {
    const existingUser = await this.findOneOrFail({ email: user.email });
    if (existingUser) {
      return existingUser;
    }
    return await this.usersRepository.save(user);
  }

  /**
   * Function to get the total number of users
   * @returns number
   */
  async getCounts() {
    const studentCount = await this.usersRepository.count({
      where: { type: 'student' },
    });
    const assesmentCount = await this.assessmentService.count({id: Not(IsNull())});
    return { studentCount, assesmentCount, assesmentCompletedCount: 5, assesmentAvg: 72 };
  }

  @Transactional()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async login(input: any, response: Response) {
    const where: ObjectLiteral = { email: input.email };
    const user = await this.findOneOrFail({
      where,
      select: ['id', 'name', 'email', 'password'],
    });
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
      id: user.id,
    });
    await this.addtokenToResponse(response, token);
    return {
      token,
    };
  }

  async addtokenToResponse(response: Response, token: string) {
    const cookieOptions: CookieOptions = await this.getCookieOptions();
    response.cookie('lecturaCookie', token, cookieOptions);
  }

  async getCookieOptions() {
    const CookieOptions: CookieOptions = {
      httpOnly: true,
      signed: true,
      domain: 'lectura.com',
      secure: false,
      // sameSite need to be none in order to work from 'localhost FE' to 'https BE'
      sameSite: 'strict',
    };
    return CookieOptions;
  }
}
