import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ObjectSchema } from 'joi';

@Injectable()
export default class ValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: any): any {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Validation failed', 'No payload provided');
    }

    const { error } = this.schema.validate(value);
    if (error) {
      throw new BadRequestException(
        'Failed to validate the input payload',
        error.message,
      );
    }
    return value;
  }
}
