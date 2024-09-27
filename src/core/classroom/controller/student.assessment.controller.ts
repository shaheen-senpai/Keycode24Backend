/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Controller,
  Res,
  Post,
  Body,
  Req,
  UseInterceptors,
  Param,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { StudentAssessmentService } from '../service/student.assessment';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';

@Controller('student-assessment')
export class StudentAssessmentController {
  constructor(private studentAssessmentService: StudentAssessmentService) {}

  @UseAuthGuard()
  @UseInterceptors(AnyFilesInterceptor())
  @Post('/create')
  async createAssessment(
    @Body() input: { assessmentId: string; score: number },
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const user = request.user as AuthUser;
      const studentAssessment =
        await this.studentAssessmentService.saveStudentAssessment(
          user.id,
          input.assessmentId,
          input.score,
        );
      return response.status(200).json({ studentAssessment });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @UseAuthGuard()
  @Post('/list/:studentId')
  async getAllStudentAssessments(
    @Param('studentId') studentId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const user = request.user as AuthUser;
      const studentAssessments = await this.studentAssessmentService.find({
        where: { userId: studentId, assessment: { createdById: user.id } },
        relations: ['assessment', 'user'],
      });
      return response.status(200).json({ studentAssessments });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
