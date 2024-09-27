import { RedisCacheService } from '../../../common/cache/redis-cache/redis-cache.service';
import { Injectable } from '@nestjs/common';
import GroupPermission from '../entity/groupPermission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export default class GroupCacheService {
  constructor(
    private cacheManager: RedisCacheService,
    @InjectRepository(GroupPermission)
    private groupPermissionRepository: Repository<GroupPermission>,
  ) {}

  /**
   * To get group Permissions from cache or set group permissions if not found
   * @param groupId
   */
  async getGroupPermissionsFromGroupId(groupId: string): Promise<string[]> {
    const permissionsFromCache = await this.cacheManager.get<string[]>(
      `GROUP:${groupId}:PERMISSIONS`,
    );
    const permissions =
      permissionsFromCache ||
      (await this.groupPermissionRepository.findBy({ groupId: groupId })).map(
        (x) => x.permissionId,
      );
    permissionsFromCache ||
      (await this.cacheManager.set(
        `GROUP:${groupId}:PERMISSIONS`,
        permissions,
      ));
    return permissionsFromCache || permissions;
  }

  /**
   * To delete group permissions in cache
   * @param id
   */
  async invalidateGroupPermissionsByGroupId(id: string) {
    this.cacheManager.del(`GROUP:${id}:PERMISSIONS`);
  }
}
