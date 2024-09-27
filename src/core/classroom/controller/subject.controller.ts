import {
  Get,
  Body,
  Controller,
  Post,
  UploadedFile,
  Res,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { Express } from 'express';
import { SubjectService } from '../service/subject.service';
import { SubjectGradeService } from '../service/subject.grade.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('subject')
export class SubjectController {
  constructor(
    private subjectService: SubjectService,
    private subjectGradeService: SubjectGradeService,
  ) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() input: { name: string },
    @UploadedFile() file: Express.Multer.File,
    @Res() response: Response,
  ) {
    try {
      if (!file || file.mimetype !== 'application/pdf') {
        return response
          .status(400)
          .json({ message: 'Invalid file type. Only PDF files are allowed.' });
      }
      const subject = await this.subjectService.create(input.name, file);
      return response
        .status(200)
        .json({ message: 'Subject created successfully', subject });
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @Post('/:id')
  async getSubjectById(@Param('id') id: string, @Res() response: Response) {
    try {
      const subject = await this.subjectService.getSubjectById(id);
      return response.status(200).json(subject);
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @Post('/:name')
  async getSubjectByName(
    @Param('name') name: string,
    @Res() response: Response,
  ) {
    try {
      const subject = await this.subjectService.getSubjectByCondition({
        name,
      });
      if (subject === null) {
        return response.status(404).json({ message: 'No subjects found' });
      }
      return response.status(200).json(subject);
    } catch (error) {
      return response.status(400).json(error);
    }
  }

  @Post('list/:gradeId')
  async getAllSubjects(
    @Param('gradeId') gradeId: string,
    @Res() response: Response,
  ) {
    try {
      const subjects = await this.subjectGradeService.getAllSubjectsByGradeId(
        gradeId,
      );
      return response.status(200).json(subjects);
    } catch (error) {
      return response.status(400).json(error);
    }
  }
}
