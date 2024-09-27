import {
  Controller,
  Res,
  Param,
  Post,
  Body,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { LessonPlanService } from '../service/lesson-plan.service';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';

@Controller('lesson-plan')
export class LessonPlanController {
  constructor(private lessonPlanService: LessonPlanService) {}

  @UseInterceptors(AnyFilesInterceptor())
  @Post('/create/:teacherId')
  async createLessonPlan(
    @Body() input: { name: string; subjectId: string; data: object },
    @Param('teacherId') teacherId: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const { name, subjectId, data } = input;
      const lessonPlan = await this.lessonPlanService.createLessonPlan(
        data,
        name,
        subjectId,
        teacherId,
      );
      return response.status(201).json({ lessonPlan });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @UseAuthGuard()
  @Post('/user/:userId')
  async getLessonPlansByUser(
    @Param('userId') userId: string,
    @Res() response: Response,
  ) {
    try {
      const lessonPlans =
        await this.lessonPlanService.getLessonPlansByUser(userId);
      return response.status(200).json({ lessonPlans });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @UseAuthGuard()
  @Post('/:id')
  async getLessonPlanById(@Param('id') id: string, @Res() response: Response) {
    try {
      const lessonPlan = await this.lessonPlanService.getLessonPlanById({
        where: { id },
      });
      return response.status(200).json({ lessonPlan });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
