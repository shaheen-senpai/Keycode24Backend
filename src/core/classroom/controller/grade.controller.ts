/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Controller, Get, Res, Param, Req } from '@nestjs/common';
import { GradeService } from '../service/grade.service';
import { Response, Request } from 'express';
import { UseAuthGuard } from 'src/core/authorization/authentication.decarator';

@Controller('grade')
export class GradeController {
  constructor(private gradeService: GradeService) {}

  @UseAuthGuard()
  @Get('/')
  async getAllGrades(@Req() request: Request, @Res() response: Response) {
    try {
      //@ts-ignore
      const user = request.user as AuthUser;
      const grades = await this.gradeService.getAllGrades({
        createdById: user.id,
      });
      return response.status(200).json({ grades });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @UseAuthGuard()
  @Get('/:id')
  async getGradeById(
    @Param('id') id: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      //@ts-ignore
      const user = request.user as AuthUser;
      const grade = await this.gradeService.getGradeById({
        where: { createdById: user.id, id },
      });
      return response.status(200).json({ grade });
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
