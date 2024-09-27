import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  NewEntityInput,
  UpdateEntityInput,
  UpdateEntityPermissionInput,
} from 'src/customer-interface/schema/graphql.schema';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import EntityModel from '../entity/entity.entity';
import EntityPermission from '../entity/entityPermission.entity';
import Permission from '../entity/permission.entity';
import { EntityNotFoundException } from '../exception/entity.exception';
import { PermissionNotFoundException } from '../exception/permission.exception';
import { EnableLog } from '../logging.decorator';

@Injectable()
export class EntityService {
  constructor(
    @InjectRepository(EntityModel)
    private entityRepository: Repository<EntityModel>,
    @InjectRepository(EntityPermission)
    private entityPermissionRepository: Repository<EntityPermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  @EnableLog()
  getAllEntities(): Promise<EntityModel[]> {
    return this.entityRepository.findBy({ active: true });
  }

  @EnableLog()
  async getEntityById(id: string): Promise<EntityModel> {
    const entity = await this.entityRepository.findOneBy({ id, active: true });
    if (entity) {
      return entity;
    }
    throw new EntityNotFoundException(id);
  }

  @Transactional()
  @EnableLog()
  async createEntity(entity: NewEntityInput): Promise<EntityModel> {
    const newEntity = this.entityRepository.create(entity);
    await this.entityRepository.save(newEntity);
    return newEntity;
  }

  @Transactional()
  @EnableLog()
  async updateEntity(
    id: string,
    entity: UpdateEntityInput,
  ): Promise<EntityModel> {
    const entityToUpdate = this.entityRepository.create(entity as EntityModel);
    await this.entityRepository.update(id, entityToUpdate);
    const updatedEntity = await this.entityRepository.findOneBy({ id });
    if (updatedEntity) {
      return updatedEntity;
    }
    throw new EntityNotFoundException(id);
  }

  @Transactional()
  @EnableLog()
  async deleteEntity(id: string): Promise<EntityModel> {
    await this.entityRepository.update(id, { active: false });
    const deletedEntity = await this.entityRepository.findOneBy({ id });
    if (deletedEntity) {
      return deletedEntity;
    }
    throw new EntityNotFoundException(id);
  }

  @Transactional()
  @EnableLog()
  async updateEntityPermissions(
    id: string,
    request: UpdateEntityPermissionInput,
  ): Promise<Permission[]> {
    const updatedEntity = await this.entityRepository.findOneBy({ id });
    if (!updatedEntity) {
      throw new EntityNotFoundException(id);
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
    const entityPermission = this.entityPermissionRepository.create(
      request.permissions.map((permission) => ({
        entityId: id,
        permissionId: permission,
      })),
    );
    const savedEntityPermissions = await this.entityPermissionRepository.save(
      entityPermission,
    );
    const permissions = await this.permissionRepository.findBy({
      id: In(savedEntityPermissions.map((g) => g.permissionId)),
    });
    return permissions;
  }

  @Transactional()
  @EnableLog()
  async getEntityPermissions(id: string): Promise<Permission[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect(
        EntityPermission,
        'entityPermission',
        'Permission.id = entityPermission.permissionId',
      )
      .where('entityPermission.entityId = :entityId', { entityId: id })
      .getMany();
    return permissions;
  }
}
