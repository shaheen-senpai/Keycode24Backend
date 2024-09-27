import { NotFoundException } from '@nestjs/common';

export class SubjectNotFoundException extends NotFoundException {
  constructor(subjectId: string) {
    super(`User ${subjectId} not found`);
  }
}
