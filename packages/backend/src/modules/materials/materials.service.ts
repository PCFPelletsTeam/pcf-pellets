import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import type { Material, Paginated } from '@pcf/shared';
import type { CreateMaterialDto } from './dto/create-material.dto';
import type { ListMaterialsQueryDto } from './dto/list-materials.query';
import type { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialEntity } from './entities/material.entity';
import { toMaterial } from './materials.mapper';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(MaterialEntity)
    private readonly materialsRepo: Repository<MaterialEntity>,
  ) {}

  async list(query: ListMaterialsQueryDto): Promise<Paginated<Material>> {
    const where: Parameters<Repository<MaterialEntity>['findAndCount']>[0] = {
      where: {
        ...(query.category ? { category: query.category } : {}),
        ...(query.search ? { name: ILike(`%${query.search}%`) } : {}),
      },
      order: { name: 'ASC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    };
    const [items, total] = await this.materialsRepo.findAndCount(where);
    return {
      items: items.map(toMaterial),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: string): Promise<Material> {
    const entity = await this.materialsRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Матеріал з id=${id} не знайдено`);
    }
    return toMaterial(entity);
  }

  /** Internal helper для інших сервісів (CalculationsService etc.) — повертає entity. */
  async getEntityOrThrow(id: string): Promise<MaterialEntity> {
    const entity = await this.materialsRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Матеріал з id=${id} не знайдено`);
    }
    return entity;
  }

  async create(dto: CreateMaterialDto): Promise<Material> {
    const entity = this.materialsRepo.create({
      name: dto.name,
      category: dto.category,
      defaultUnit: dto.defaultUnit,
      description: dto.description ?? null,
    });
    const saved = await this.materialsRepo.save(entity);
    return toMaterial(saved);
  }

  async update(id: string, dto: UpdateMaterialDto): Promise<Material> {
    const entity = await this.getEntityOrThrow(id);
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.category !== undefined) entity.category = dto.category;
    if (dto.defaultUnit !== undefined) entity.defaultUnit = dto.defaultUnit;
    if (dto.description !== undefined)
      entity.description = dto.description ?? null;
    const saved = await this.materialsRepo.save(entity);
    return toMaterial(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.materialsRepo.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Матеріал з id=${id} не знайдено`);
    }
  }

  /** Використовується сидером — кількість записів. */
  async count(): Promise<number> {
    return this.materialsRepo.count();
  }

  /** Використовується сидером — bulk insert без перевірки унікальності. */
  async bulkInsert(items: CreateMaterialDto[]): Promise<void> {
    const entities = items.map((dto) =>
      this.materialsRepo.create({
        name: dto.name,
        category: dto.category,
        defaultUnit: dto.defaultUnit,
        description: dto.description ?? null,
      }),
    );
    await this.materialsRepo.save(entities);
  }
}
