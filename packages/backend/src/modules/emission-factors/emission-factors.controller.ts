import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { EmissionFactor, Paginated } from '@pcf/shared';
import { ListEmissionFactorsQueryDto } from './dto/list-emission-factors.query';
import { EmissionFactorsService } from './emission-factors.service';

@ApiTags('emission-factors')
@Controller({ path: 'emission-factors', version: '1' })
export class EmissionFactorsController {
  constructor(private readonly efService: EmissionFactorsService) {}

  @Get()
  @ApiOperation({
    summary: 'Список EF з фільтрами',
    description:
      "EF тільки для читання — оновлюються через JSON-seed файл та повторний запуск seeder'а. " +
      'Це навмисно: значення EF мають проходити методичну перевірку, не міняти на льоту через UI.',
  })
  @ApiOkResponse()
  list(
    @Query() query: ListEmissionFactorsQueryDto,
  ): Promise<Paginated<EmissionFactor>> {
    return this.efService.list(query);
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Знайти EF за бізнес-ключем' })
  @ApiParam({ name: 'key', example: 'ELECTRICITY_UA_GRID_AVG' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findByKey(@Param('key') key: string): Promise<EmissionFactor> {
    return this.efService.findByKey(key);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Знайти EF за UUID' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id') id: string): Promise<EmissionFactor> {
    return this.efService.findOne(id);
  }
}
