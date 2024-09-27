import { BadRequestException } from '@nestjs/common';

export class InvalidPayloadException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
