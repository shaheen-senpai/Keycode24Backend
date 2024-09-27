import { RedisCacheService } from '../../../common/cache/redis-cache/redis-cache.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import UserGroup from '../entity/userGroup.entity';
import UserPermission from '../entity/userPermission.entity';
import UserOrganisationService from './user.organisation.service';
import { UserOrganisationStatus } from '../../../customer-interface/schema/graphql.schema';
import { RESEND_MAIL_VERIFICATION_WINDOW_HOURS } from '../../authentication/constants/authentication.constants';

@Injectable()
export default class UserCacheService {
  constructor(
    private cacheManager: RedisCacheService,
    @InjectRepository(UserGroup)
    private userGroupRepository: Repository<UserGroup>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
    private userOrganisationService: UserOrganisationService,
  ) {}

  /**
   * To get User Groups by userId from cache or set User Groups to cache if not found
   * @param userId
   * @param organisationId
   */
  async getUserGroupsByUserId(
    userId: string,
    organisationId: string,
  ): Promise<string[]> {
    const groupsFromCache = await this.cacheManager.get<string[]>(
      `USER:${userId}:GROUPS`,
    );
    if (groupsFromCache) return groupsFromCache;
    // When user get inactivated or deleted, this cache will removed.
    // So, here we are checking user organisation status
    const userOrg = await this.userOrganisationService.findOneOrFail({
      userId,
      organisationId,
    });
    if (userOrg.status === UserOrganisationStatus.Inactive) {
      throw new UnauthorizedException('User is inactive');
    }
    const groups = (
      await this.userGroupRepository.findBy({ userId, organisationId })
    ).map((x) => x.groupId);
    await this.cacheManager.set(`USER:${userId}:GROUPS`, groups);
    return groups;
  }

  /**
   * To get User permissions by userId from cache or set User permissions to cache if not found
   * @param userId
   */
  async getUserPermissionsByUserId(userId: string): Promise<string[]> {
    const permissionsFromCache = await this.cacheManager.get<string[]>(
      `USER:${userId}:PERMISSIONS`,
    );
    const permissions =
      permissionsFromCache ||
      (await this.userPermissionRepository.findBy({ userId: userId })).map(
        (x) => x.permissionId,
      );
    permissionsFromCache ||
      (await this.cacheManager.set(`USER:${userId}:PERMISSIONS`, permissions));
    return permissionsFromCache || permissions;
  }

  /**
   * Get resendEmailVerification attempt key
   * @param userId
   * @returns resendEmailVerification key
   */
  getResendEmailVerificationAttemptCacheKey = (userId: string) => {
    return `${userId}:resendEmailVerificationAttempts`;
  };

  /**
   * To get the resendForgotPassword attempt key
   * @param email
   * @returns resendForgotPassword key
   */
  getResendUpdatePasswordAttemptCacheKey = (email: string) => {
    return `${email}:resendUpdatePasswordAttempts`;
  };

  /**
   * To get resendEmailVerification Attempts from cache
   * @param userId
   */
  async getOrSetSendEmailVerificationAttemptsFromCache(userId: string) {
    const resendEmailVerificationAttempts = ((await this.cacheManager.get(
      this.getResendEmailVerificationAttemptCacheKey(userId),
    )) || 0) as number;
    const updatedAttempts = resendEmailVerificationAttempts + 1;
    await this.cacheManager.set(
      this.getResendEmailVerificationAttemptCacheKey(userId),
      updatedAttempts,
      RESEND_MAIL_VERIFICATION_WINDOW_HOURS * 60 * 60, // 24 hours
    );
    return updatedAttempts;
  }

  /**
   * To get resendForgotPassword Attempts from cache
   * @param userId
   * @returns
   */
  async getOrSetSendForgotPasswordAttemptsFromCache(email: string) {
    const resendUpdatePasswordAttempts = ((await this.cacheManager.get(
      this.getResendUpdatePasswordAttemptCacheKey(email),
    )) || 0) as number;
    const updatedAttempts = resendUpdatePasswordAttempts + 1;
    await this.cacheManager.set(
      this.getResendUpdatePasswordAttemptCacheKey(email),
      updatedAttempts,
      RESEND_MAIL_VERIFICATION_WINDOW_HOURS * 60 * 60, // 24 hours
    );
    return updatedAttempts;
  }

  /**
   * To delete User permissions in cache
   * @param userId
   */
  async invalidateUserPermissionsCache(userId: string) {
    await this.cacheManager.del(`USER:${userId}:PERMISSIONS`);
  }

  /**
   * To delete User groups in cache
   * @param userId
   */
  async invalidateUserGroupsCache(userId: string) {
    await this.cacheManager.del(`USER:${userId}:GROUPS`);
  }
}
