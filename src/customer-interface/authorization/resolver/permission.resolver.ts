import { ParseUUIDPipe } from '@nestjs/common';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import {
  NewPermissionInput,
  UpdatePermissionInput,
  UserType,
} from '../../schema/graphql.schema';
import { PermissionsType } from '../../../core/authorization/constants/authorization.constants';
import Permission from '../../../core/authorization/entity/permission.entity';
import { Permissions } from '../../../core/authorization/permissions.decorator';
import { PermissionService } from '../../../core/authorization/service/permission.service';
import { AuthGuard } from '../../../core/authentication/authentication.guard';
import { UseGuards } from '@nestjs/common';

@Resolver('Permission')
export class PermissionResolver {
  constructor(private permissionService: PermissionService) {}

  @UseGuards(AuthGuard)
  @Query()
  getPermissions(): Promise<Permission[]> {
    return this.permissionService.getAllPermissions(UserType.Customer);
  }

  @Permissions(PermissionsType.ViewPermissions)
  @Query()
  getPermission(@Args('id', ParseUUIDPipe) id: string): Promise<Permission> {
    return this.permissionService.getPermissionById(id);
  }

  @Permissions(PermissionsType.CreatePermissions)
  @Mutation()
  async createPermission(
    @Args('input') userInput: NewPermissionInput,
  ): Promise<Permission> {
    return this.permissionService.createPermission(userInput);
  }

  @Permissions(PermissionsType.EditPermissions)
  @Mutation()
  async updatePermission(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('input') userInput: UpdatePermissionInput,
  ): Promise<Permission> {
    return this.permissionService.updatePermission(id, userInput);
  }

  @Permissions(PermissionsType.DeletePermissions)
  @Mutation()
  async deletePermission(
    @Args('id', ParseUUIDPipe) id: string,
  ): Promise<Permission> {
    return this.permissionService.deletePermission(id);
  }
}
