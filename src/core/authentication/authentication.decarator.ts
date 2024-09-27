import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthTarget } from './constants/authentication.constants';
import { AuthGuard } from './authentication.guard';

export const UseAuthGuard = (target = AuthTarget.Organisation) => {
  return applyDecorators(UseGuards(AuthGuard), SetMetadata('target', target));
};
