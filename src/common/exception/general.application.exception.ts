import { HttpException } from '@nestjs/common';

export class GeneralApplicationException extends HttpException {
  constructor(message: string, error?: string, statusCode = 400) {
    super({ message, error }, statusCode);
  }
}

export function generalError(message: string, error?: string): never {
  throw new GeneralApplicationException(message, error);
}
