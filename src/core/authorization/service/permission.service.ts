import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional';
import {
  NewPermissionInput,
  UpdatePermissionInput,
  UserType,
} from 'src/customer-interface/schema/graphql.schema';
import { FindManyOptions, ObjectLiteral, Repository } from 'typeorm';
import {
  PermissionNotFoundException,
  PermissionDeleteNotAllowedException,
} from '../exception/permission.exception';
import Permission from '../entity/permission.entity';
import UserPermission from '../entity/userPermission.entity';
import GroupPermission from '../entity/groupPermission.entity';
import { EnableLog } from '../logging.decorator';
import { BaseService } from 'src/common/utils/base.service';

@Injectable()
export class PermissionService extends BaseService<Permission> {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectRepository(UserPermission)
    private userPermissionsRepository: Repository<UserPermission>,
    @InjectRepository(GroupPermission)
    private groupPermissionRepository: Repository<GroupPermission>,
  ) {
    super(permissionsRepository);
  }

  /**
   * To get permissions using condition
   * @param input
   * @returns List of Permissions
   */
  async find(
    input: string[] | FindManyOptions<Permission> | ObjectLiteral,
  ): Promise<Permission[]> {
    return await super.find(input);
  }

  /**
   * To get all Permissions of a UserType
   * @param userType
   * @returns List of Permissions
   */
  getAllPermissions(userType: UserType): Promise<Permission[]> {
    return this.permissionsRepository.findBy({ active: true, type: userType });
  }

  /**
   * To get a Permission by it's id
   * @param id
   * @returns Permission
   */
  async getPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOneBy({
      id,
      active: true,
    });
    if (permission) {
      return permission;
    }
    throw new PermissionNotFoundException(id);
  }

  /**
   * To save a new permission
   * @param permission
   * @returns Permission
   */
  @Transactional()
  @EnableLog()
  async createPermission(permission: NewPermissionInput): Promise<Permission> {
    const newPermission = await this.permissionsRepository.create(permission);
    const savedPermission = await this.permissionsRepository.save(
      newPermission,
    );
    return savedPermission;
  }

  /**
   * To update a Permission
   * @param id
   * @param permission
   * @returns Permission
   */
  @Transactional()
  @EnableLog()
  async updatePermission(
    id: string,
    permission: UpdatePermissionInput,
  ): Promise<Permission> {
    const permissionToUpdate = this.permissionsRepository.create(
      permission as Permission,
    );
    await this.permissionsRepository.update(id, permissionToUpdate);
    const updatedPermission = await this.permissionsRepository.findOneBy({
      id,
    });
    if (updatedPermission) {
      return updatedPermission;
    }
    throw new PermissionNotFoundException(id);
  }

  /**
   * To update a Permission by active to false
   * @param id
   * @returns Permission
   */
  @Transactional()
  @EnableLog()
  async deletePermission(id: string): Promise<Permission> {
    if (await this.checkPermissionUsage(id)) {
      throw new PermissionDeleteNotAllowedException(id);
    }
    await this.permissionsRepository.update(id, { active: false });
    const deletedPermission = await this.permissionsRepository.findOneBy({
      id,
    });
    if (deletedPermission) {
      return deletedPermission;
    }
    throw new PermissionNotFoundException(id);
  }

  private async checkPermissionUsage(id: string) {
    const userCount = await this.userPermissionsRepository.count({
      where: { permissionId: id },
    });
    const groupCount = await this.groupPermissionRepository.count({
      where: { permissionId: id },
    });

    const totalCount = userCount + groupCount;
    return totalCount != 0;
  }
}
