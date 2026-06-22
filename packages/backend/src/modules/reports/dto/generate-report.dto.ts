import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ReportFormat } from '@pcf/shared';

export class GenerateReportDto {
  @ApiProperty({ description: 'UUID PCF-розрахунку' })
  @IsUUID()
  calculationId!: string;

  @ApiProperty({ enum: ReportFormat })
  @IsEnum(ReportFormat)
  format!: ReportFormat;

  @ApiPropertyOptional({ enum: ['uk', 'en'], default: 'uk' })
  @IsOptional()
  @IsIn(['uk', 'en'])
  locale?: 'uk' | 'en';
}
