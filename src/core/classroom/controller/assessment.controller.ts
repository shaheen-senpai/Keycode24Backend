/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Controller,
  Res,
  Param,
  Query,
  Post,
  Body,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AssessmentService } from '../service/assessment.service';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';

@Controller('assessment')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  @UseAuthGuard()
  @Post('/list')
  async getAllAssessments(
    @Query('subjectId') subjectId: string,
    @Query('gradeId') gradeId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const user = request.user as AuthUser;
      const assessments = await this.assessmentService.getAllAssessments({
        gradeId,
        subjectId,
        createdById: user.id,
      });
      return response.status(200).json({ assessments });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @UseAuthGuard()
  @UseInterceptors(AnyFilesInterceptor())
  @Post('/create')
  async createAssessment(
    @Body() input: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const user = request.user as AuthUser;
      const assessment = await this.assessmentService.createAssessment(
        input,
        user,
      );
      return response.status(200).json({ assessment });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @UseAuthGuard()
  @Post('/:id')
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
