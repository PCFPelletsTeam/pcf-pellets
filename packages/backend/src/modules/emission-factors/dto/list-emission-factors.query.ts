import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ElectricitySource, GhgScope, MaterialCategory } from '@pcf/shared';

export class ListEmissionFactorsQueryDto {
  @ApiPropertyOptional({
    enum: MaterialCategory,
    description: 'Фільтр за категорією',
  })
  @IsOptional()
  @IsEnum(MaterialCategory)
  category?: MaterialCategory;

  @ApiPropertyOptional({ enum: GhgScope, description: 'Фільтр за GHG Scope' })
  @IsOptional()
  @IsEnum(GhgScope)
  scope?: GhgScope;

  @ApiPropertyOptional({
    enum: ElectricitySource,
    description: 'Тільки для category=ELECTRICITY: конкретне джерело',
  })
  @IsOptional()
  @IsEnum(ElectricitySource)
  electricitySource?: ElectricitySource;

  @ApiPropertyOptional({ description: 'Регіон ISO-3166 alpha-2 або "GLOBAL"' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Рік EF' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize: number = 100;
}
