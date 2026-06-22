import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { CalculationMode } from '@pcf/shared';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ListCalculationsQueryDto {
  @ApiPropertyOptional({
    enum: CalculationMode,
    description: 'Фільтр за режимом',
  })
  @IsOptional()
  @IsEnum(CalculationMode)
  mode?: CalculationMode;

  @ApiPropertyOptional({ description: 'Назва підприємства (substring)' })
  @IsOptional()
  @IsString()
  facilityName?: string;

  @ApiPropertyOptional({ description: 'Початок діапазону, ISO YYYY-MM-DD' })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'periodFrom має бути у форматі YYYY-MM-DD' })
  periodFrom?: string;

  @ApiPropertyOptional({ description: 'Кінець діапазону, ISO YYYY-MM-DD' })
  @IsOptional()
  @Matches(ISO_DATE, { message: 'periodTo має бути у форматі YYYY-MM-DD' })
  periodTo?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
