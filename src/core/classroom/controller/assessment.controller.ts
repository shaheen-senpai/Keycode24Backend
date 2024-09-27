import { Controller, Get, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { AssessmentService } from '../service/assessment.service';

@Controller('assessment')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @Get('/:subjectId/:gradeId')
  async getAllAssessments(
    @Param('subjectId') subjectId: string,
    @Param('gradeId') gradeId: string,
    @Res() response: Response,
  ) {
    try {
      const assessments = await this.assessmentService.getAllAssessments({
        gradeId,
        subjectId,
      });
      return response.status(200).json({ assessments });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @Get('/:subjectId/:gradeId/:id')
  async getAssessmentById(
    @Param('subjectId') subjectId: string,
    @Param('gradeId') gradeId: string,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      const assessment = await this.assessmentService.getAssessmentById({
        where: { subjectId, id, gradeId },
      });
      return response.status(200).json({ assessment });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
