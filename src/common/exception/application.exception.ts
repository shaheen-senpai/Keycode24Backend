import { HttpException } from '@nestjs/common';
import { CustomError } from './errorCode';

export class ApplicationException extends HttpException {
  constructor(customError: CustomError) {
    super(customError, customError.HTTPCODE);
  }
}
