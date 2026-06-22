import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  CalculationMode,
  ElectricitySource,
  MaterialCategory,
  Unit,
} from '@pcf/shared';

const DECIMAL_RE = /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
const POSITIVE_DECIMAL_RE = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export class PeriodDto {
  @ApiProperty({
    description: 'Початок періоду, ISO YYYY-MM-DD',
    example: '2026-01-01',
  })
  @IsISO8601({ strict: true })
  startDate!: string;

  @ApiProperty({
    description: 'Кінець періоду включно, ISO YYYY-MM-DD',
    example: '2026-03-31',
  })
  @IsISO8601({ strict: true })
  endDate!: string;

  @ApiPropertyOptional({ description: 'Людська назва', example: 'Q1 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}

export class CalculationInputItemDto {
  @ApiProperty({ description: 'UUID рядка (генерується frontend)' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'UUID матеріалу з довідника /materials' })
  @IsUUID()
  materialId!: string;

  @ApiProperty({ enum: MaterialCategory })
  @IsEnum(MaterialCategory)
  category!: MaterialCategory;

  @ApiProperty({
    description: 'Кількість як decimal-string (для збереження точності)',
    example: '5000000',
  })
  @IsString()
  @Matches(POSITIVE_DECIMAL_RE, {
    message:
      'quantity має бути додатнім decimal-string (наприклад "5000000" або "1234.567")',
  })
  quantity!: string;

  @ApiProperty({ enum: Unit, description: 'Одиниця кількості' })
  @IsEnum(Unit)
  unit!: Unit;

  @ApiPropertyOptional({
    enum: ElectricitySource,
    description: "Обов'язково при category=ELECTRICITY",
  })
  @IsOptional()
  @IsEnum(ElectricitySource)
  electricitySource?: ElectricitySource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ProcessParametersDto {
  @ApiProperty({
    description: 'Маса виробленого продукту за період',
    example: '100000',
  })
  @IsString()
  @Matches(POSITIVE_DECIMAL_RE, {
    message: 'outputMass має бути додатнім decimal-string',
  })
  outputMass!: string;

  @ApiProperty({ enum: Unit })
  @IsEnum(Unit)
  outputMassUnit!: Unit;

  @ApiPropertyOptional({
    description: 'Технологічні втрати (%) — як decimal-string',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_RE, {
    message: 'technologicalLossesPercent має бути decimal-string',
  })
  technologicalLossesPercent?: string;

  @ApiPropertyOptional({
    description: 'Назва конкретної установки / лінії випалу',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  productionLineName?: string;
}

export class CreateCalculationDto {
  @ApiProperty({ type: PeriodDto })
  @ValidateNested()
  @Type(() => PeriodDto)
  period!: PeriodDto;

  @ApiProperty({
    enum: CalculationMode,
    description: 'ISO_14067 (з Scope 3) або CBAM (тільки Scope 1+2)',
  })
  @IsEnum(CalculationMode)
  mode!: CalculationMode;

  @ApiProperty({
    description: 'Назва підприємства',
    example: 'Полтавський ГЗК, фабрика окатишів №2',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  facilityName!: string;

  @ApiProperty({
    type: [CalculationInputItemDto],
    description: 'Усі input items (≥ 1)',
  })
  @ValidateNested({ each: true })
  @Type(() => CalculationInputItemDto)
  @ArrayMinSize(1)
  items!: CalculationInputItemDto[];

  @ApiProperty({ type: ProcessParametersDto })
  @ValidateNested()
  @Type(() => ProcessParametersDto)
  process!: ProcessParametersDto;

  @ApiPropertyOptional({ description: 'Загальні нотатки до розрахунку' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
