import { NotFoundException } from '@nestjs/common';

export class EntityNotFoundException extends NotFoundException {
  constructor(entityName: string, entityId: string) {
    super(`${entityName} entity with id ${entityId} not found`);
  }
}
