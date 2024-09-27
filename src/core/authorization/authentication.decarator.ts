import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from './authentication.guard';

export const UseAuthGuard = () => {
  return applyDecorators(UseGuards(AuthGuard));
};
