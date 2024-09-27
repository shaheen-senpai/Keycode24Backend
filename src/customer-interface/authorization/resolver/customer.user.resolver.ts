import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import DataLoader from 'dataloader';
import UserGroup from '../../../core/authorization/entity/userGroup.entity';
import User from '../../../core/authorization/entity/user.entity';
import { InjectLoader } from '@keyvaluesystems/nestjs-dataloader';
import {
  AccessTokenData,
  CustomerGroupType,
} from '../../../core/authorization/constants/authorization.constants';
import { getEnumIndex } from '../../../common/utils/array.object.utils';

@Resolver('CustomerUser')
export class CustomerUserResolver {
  @ResolveField()
  async userGroup(
    @Parent() user: User,
    @Context('user') authUser: AccessTokenData,
    @InjectLoader({
      fromEntity: UserGroup,
      resolveType: 'many',
      fieldName: 'userId',
      resolveInput: {
        relations: ['group'],
      },
    })
    loader: DataLoader<string, UserGroup[]>,
  ) {
    return (
      (await loader.load(user.id))
        ?.filter(
          (userGroup) => userGroup.organisationId === authUser.organisation.id,
        )
        // Sorting based on group name order in the CustomerGroupType. Later will remove when restricted to only one group
        .sort((a, b) => {
          return (
            getEnumIndex(CustomerGroupType, a?.group?.name || '') -
            getEnumIndex(CustomerGroupType, b?.group?.name || '')
          );
        })
    );
  }
}
