import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { validate } from '../../../common/utils/validation.utils';
import { ConnectEmailWithSingpassForExistingUserInputValidation } from '../../../core/authentication/validation/signpass.validation.schema';
import { SingpassService } from '../../../core/authentication/service/singpass.service';
import { ConnectEmailInput } from '../../schema/graphql.schema';

@Resolver()
export class SingpassResolver {
  constructor(private singpassService: SingpassService) {}

  @Mutation('connectEmailWithSingpassForExistingUser')
  async connectEmailWithSingpassForExistingUser(
    @Args('input') input: ConnectEmailInput,
  ) {
    input = await validate(
      ConnectEmailWithSingpassForExistingUserInputValidation,
      input,
    );
    const resp =
      await this.singpassService.connectEmailWithSingpassForExistingUser(input);
    return resp;
  }
}
