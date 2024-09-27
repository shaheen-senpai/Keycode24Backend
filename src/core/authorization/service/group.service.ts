import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  NewGroupInput,
  UpdateGroupInput,
  UpdateGroupPermissionInput,
  UserType,
} from '../../../customer-interface/schema/graphql.schema';
import { DeleteResult, In, Not, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Group from '../entity/group.entity';
import GroupPermission from '../entity/groupPermission.entity';
import Permission from '../entity/permission.entity';
import UserGroup from '../entity/userGroup.entity';
import {
  GroupNotFoundException,
  GroupDeleteNotAllowedException,
} from '../exception/group.exception';
import { PermissionNotFoundException } from '../exception/permission.exception';
import { EnableLog } from '../logging.decorator';
import GroupCacheService from './groupcache.service';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private userGroupRepository: Repository<UserGroup>,
    @InjectRepository(GroupPermission)
    private groupPermissionRepository: Repository<GroupPermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private groupCacheService: GroupCacheService,
  ) {}

  /**
   * To get all groups
   * @returns List of Groups
   */
  @EnableLog()
  getAllGroups(): Promise<Group[]> {
    return this.groupsRepository.findBy({ active: true });
  }
  /**
   * To get all groups with type 'Customer'
   * @returns List of Groups
   */
  @EnableLog()
  getCustomerGroups(): Promise<Group[]> {
    return this.groupsRepository.findBy({
      active: true,
      type: UserType.Customer,
      name: Not('System Admin'),
    });
  }

  /**
   * To get group by id
   * @param id
   * @returns Group
   */
  @EnableLog()
  async getGroupById(id: string): Promise<Group> {
    const group = await this.groupsRepository.findOneBy({ id, active: true });
    if (group) {
      return group;
    }
    throw new GroupNotFoundException(id);
  }

  /**
   * To create a new group
   * @param group
   * @returns Group
   */
  @Transactional()
  @EnableLog()
  async createGroup(group: NewGroupInput): Promise<Group> {
    const newGroup = await this.groupsRepository.create(group);
    await this.groupsRepository.save(newGroup);
    return newGroup;
  }

  /**
   * To update a group
   * @param id
   * @param group
   * @returns Group
   */
  @Transactional()
  @EnableLog()
  async updateGroup(id: string, group: UpdateGroupInput): Promise<Group> {
    const groupToUpdate = this.groupsRepository.create(group as Group);
    await this.groupsRepository.update(id, groupToUpdate);
    const updatedGroup = await this.groupsRepository.findOneBy({ id });
    if (updatedGroup) {
      return updatedGroup;
    }
    throw new GroupNotFoundException(id);
  }

  /**
   * To delete a group
   * @param id
   */
  @Transactional()
  @EnableLog()
  async deleteGroup(id: string): Promise<Group> {
    const usage = await this.checkGroupUsage(id);
    if (usage) {
      throw new GroupDeleteNotAllowedException(id);
    }
    await this.groupsRepository.update(id, { active: false });
    const deletedGroup = await this.groupsRepository.findOneBy({ id });
    if (deletedGroup) {
      await this.groupCacheService.invalidateGroupPermissionsByGroupId(id);
      return deletedGroup;
    }
    throw new GroupNotFoundException(id);
  }

  /**
   * To update group permissions
   * @param id
   * @param request
   * @returns List of Permissions
   */
  @Transactional()
  @EnableLog()
  async updateGroupPermissions(
    id: string,
    request: UpdateGroupPermissionInput,
  ): Promise<Permission[]> {
    const updatedGroup = await this.groupsRepository.findOneBy({ id });
    if (!updatedGroup) {
      throw new GroupNotFoundException(id);
    }

    const permissionsInRequest = await this.permissionRepository.findBy({
      id: In(request.permissions),
    });
    if (permissionsInRequest.length !== request.permissions.length) {
      const validPermissions = permissionsInRequest.map((p) => p.id);
      throw new PermissionNotFoundException(
        request.permissions
          .filter((p) => !validPermissions.includes(p))
          .toString(),
      );
    }
    const groupPermission = this.groupPermissionRepository.create(
      request.permissions.map((permission) => ({
        groupId: id,
        permissionId: permission,
      })),
    );
    const savedGroupPermissions = await this.groupPermissionRepository.save(
      groupPermission,
    );
    const permissions = await this.permissionRepository.findBy({
      id: In(savedGroupPermissions.map((g) => g.permissionId)),
    });
    await this.groupCacheService.invalidateGroupPermissionsByGroupId(id);
    return permissions;
  }

  /**
   * To get group permissions
   * @param id
   * @returns List of Permissions
   */
  @EnableLog()
  async getGroupPermissions(id: string): Promise<Permission[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect(
        GroupPermission,
        'groupPermission',
        'Permission.id = groupPermission.permissionId',
      )
      .where('groupPermission.groupId = :groupId', { groupId: id })
      .getMany();
    return permissions;
  }

  /**
   * To create a user group
   * @param userGroup
   */
  @EnableLog()
  async createUserGroup(userGroup: UserGroup[]): Promise<UserGroup[]> {
    return await this.userGroupRepository.save(userGroup);
  }

  /**
   * to delete the specified user groups based on userId and orgId
   * @param userId
   * @param orgId
   * @returns
   */
  @EnableLog()
  async deleteUserGroups(
    userId: string,
    organisationId: string,
  ): Promise<DeleteResult> {
    return await this.userGroupRepository.delete({ userId, organisationId });
  }

  private async checkGroupUsage(id: string) {
    const userCount = await this.userGroupRepository.count({
      where: { groupId: id },
    });
    return userCount != 0;
  }
}
