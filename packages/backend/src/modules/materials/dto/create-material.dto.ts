import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MaterialCategory, Unit } from '@pcf/shared';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Назва матеріалу',
    example: 'Магнетитовий концентрат ПГЗК',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Категорія матеріалу — ключ для фільтрації EF',
    enum: MaterialCategory,
    example: MaterialCategory.IRON_ORE_CONCENTRATE,
  })
  @IsEnum(MaterialCategory)
  category!: MaterialCategory;

  @ApiProperty({
    description: 'Одиниця за замовчуванням, у якій інженер вводить кількість',
    enum: Unit,
    example: Unit.TONNE,
  })
  @IsEnum(Unit)
  defaultUnit!: Unit;

  @ApiPropertyOptional({
    description: 'Опис / технічні характеристики',
    example: 'Вміст Fe ≥ 65%, вологість ≤ 9%',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
