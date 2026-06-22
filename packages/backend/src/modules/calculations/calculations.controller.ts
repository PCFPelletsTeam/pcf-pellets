import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Paginated, PCFCalculation } from '@pcf/shared';
import { CalculationsService } from './calculations.service';
import { CreateCalculationDto } from './dto/create-calculation.dto';
import { ListCalculationsQueryDto } from './dto/list-calculations.query';

@ApiTags('calculations')
@Controller({ path: 'calculations', version: '1' })
export class CalculationsController {
  constructor(private readonly calcService: CalculationsService) {}

  @Get()
  @ApiOperation({ summary: 'Список збережених PCF-розрахунків' })
  @ApiOkResponse()
  list(
    @Query() query: ListCalculationsQueryDto,
  ): Promise<Paginated<PCFCalculation>> {
    return this.calcService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Деталі PCF-розрахунку (з усіма audit-trail рядками)',
  })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PCFCalculation> {
    return this.calcService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Виконати PCF-розрахунок та зберегти його',
    description:
      'Engine: для кожного item обирає EF, конвертує одиниці, рахує emissions через decimal.js, ' +
      'групує за Scope 1/2/3, обчислює PCF = total / outputMassKg. Усі EF зберігаються як ' +
      'snapshot у calculation_lines для audit trail (ISO 14067 / CBAM).',
  })
  @ApiCreatedResponse({
    description: 'Створений розрахунок з повним breakdown',
  })
  @ApiBadRequestResponse({
    description:
      'Помилка валідації inputs, відсутній EF для category, невідповідні класи одиниць тощо',
  })
  create(@Body() dto: CreateCalculationDto): Promise<PCFCalculation> {
    return this.calcService.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Видалити розрахунок (CASCADE видаляє calculation_lines і reports)',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.calcService.remove(id);
  }
}
