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
import { StudentAssessmentService } from '../service/student.assessment.service';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';
import { AssessmentService } from '../service/assessment.service';

@Controller('student-assessment')
export class StudentAssessmentController {
  constructor(
    private studentAssessmentService: StudentAssessmentService,
    private assessmentService: AssessmentService,
  ) {}

  @UseAuthGuard()
  @Post('/create')
  async createAssessment(
    @Body('questions') questions: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const user = request.user as AuthUser;
      const { score, assessmentId } =
        await this.studentAssessmentService.calculateScore(questions);
      const studentAssessment =
        await this.studentAssessmentService.saveStudentAssessment(
          user.id,
          assessmentId,
          score,
        );
      return response.status(201).json({ questions, score });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @Post('/list/:studentId')
  async getAllStudentAssessments(
    @Param('studentId') studentId: string,
    @Res() response: Response,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const studentAssessments = await this.studentAssessmentService.find({
        where: { userId: studentId },
        relations: [
          'assessment',
          'user',
          'assessment.subject',
          'assessment.grade',
        ],
      });
      await Promise.all(
        studentAssessments.map(async (el) => {
          el.assessment!.avgScore =
            await this.assessmentService.getAverageScore(
              studentId,
              el.assessment!.id,
            );
        }),
      );
      return response.status(200).json({ studentAssessments });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
