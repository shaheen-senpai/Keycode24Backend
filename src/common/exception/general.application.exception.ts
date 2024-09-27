import { HttpException } from '@nestjs/common';

export class GeneralApplicationException extends HttpException {
  constructor(message: string, error?: string) {
    super({ message, error }, 400);
  }
}

export function generalError(message: string, error?: string): never {
  throw new GeneralApplicationException(message, error);
}
