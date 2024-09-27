import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/common/utils/base.service';
import Question from '../entity/question.entity';
import {
  DeleteResult,
  FindOptionsWhere,
  InsertResult,
  Repository,
} from 'typeorm';

@Injectable()
export class QuestionService extends BaseService<Question> {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {
    super(questionRepository);
  }

  public async insert(list: Array<Question>): Promise<InsertResult> {
    return await this.questionRepository.insert(list);
  }

  /**
   * To delete an EventReminder
   * @param where
   */
  public async delete(
    where: FindOptionsWhere<Question>,
  ): Promise<DeleteResult> {
    return await this.questionRepository.delete(where);
  }
}
