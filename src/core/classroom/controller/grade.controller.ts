import { Controller, Get, Res, Param } from '@nestjs/common';
import { GradeService } from '../service/grade.service';
import { Response } from 'express';

@Controller('grade')
export class GradeController {
  constructor(private gradeService: GradeService) {}

  @Get('/:teacherId')
  async getAllGrades(
    @Param('teacherId') teacherId: string,
    @Res() response: Response,
  ) {
    try {
      const grades = await this.gradeService.getAllGrades({
        createdById: teacherId,
      });
      return response.status(200).json({ grades });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @Get('/:teacherId/:id')
  async getGradeById(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string,
    @Res() response: Response,
  ) {
    try {
      const grade = await this.gradeService.getGradeById({
        where: { createdById: teacherId, id },
      });
      return response.status(200).json({ grade });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
