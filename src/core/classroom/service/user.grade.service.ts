import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/utils/base.service';
import { Repository } from 'typeorm';
import UserGrade from '../entity/user.grade.entity'; // Adjust path accordingly
import User from 'src/core/authorization/entity/user.entity'; // Adjust path accordingly

@Injectable()
export class UserGradeService extends BaseService<UserGrade> {
  constructor(
    @InjectRepository(UserGrade)
    private readonly userGradeRepository: Repository<UserGrade>,
  ) {
    super(userGradeRepository);
  }

  /**
   * Get all users associated with a specific grade
   * @param gradeId The ID of the grade
   * @returns An array of users
   */
  async getAllUsersByGradeId(gradeId: string): Promise<User[]> {
    const userGrades = await this.userGradeRepository.find({
      where: { gradeId },
      relations: ['user'], // Ensure that the user relation is loaded
    });

    // Map the user grades to extract the users
    const users = userGrades
      .map((userGrade) => userGrade.user)
      .filter((user) => user !== undefined);

    return users;
  }
}
