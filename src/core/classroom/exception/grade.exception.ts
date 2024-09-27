import { NotFoundException } from '@nestjs/common';

export class GradeNotFoundException extends NotFoundException {
  constructor(gradeId: string) {
    super(`User ${gradeId} not found`);
  }
}
