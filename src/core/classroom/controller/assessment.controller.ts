import { Controller, Get, Res, Param, Query } from '@nestjs/common';
import { Response } from 'express';
import { AssessmentService } from '../service/assessment.service';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';

@Controller('assessment')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @UseAuthGuard()
  @Get('/')
  async getAllAssessments(
    @Query('subjectId') subjectId: string,
    @Query('gradeId') gradeId: string,
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

  @UseAuthGuard()
  @Get('/:id')
  async getAssessmentById(
    @Query('subjectId') subjectId: string,
    @Query('gradeId') gradeId: string,
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
