import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { TokenType } from './constants/authentication.constants';
import { TokenGuard } from './token.guard';

export const UseTokenGuard = (tokenType: TokenType) => {
  return applyDecorators(
    UseGuards(TokenGuard),
    SetMetadata('tokenType', tokenType),
  );
};
