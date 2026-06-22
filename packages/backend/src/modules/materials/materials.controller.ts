import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Material, Paginated } from '@pcf/shared';
import { CreateMaterialDto } from './dto/create-material.dto';
import { ListMaterialsQueryDto } from './dto/list-materials.query';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('materials')
@Controller({ path: 'materials', version: '1' })
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'Список матеріалів з фільтрами та пагінацією' })
  @ApiOkResponse({ description: 'Пагінований список матеріалів' })
  list(@Query() query: ListMaterialsQueryDto): Promise<Paginated<Material>> {
    return this.materialsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати матеріал за UUID' })
  @ApiOkResponse({ description: 'Матеріал' })
  @ApiNotFoundResponse({ description: 'Матеріал не знайдено' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Material> {
    return this.materialsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Створити новий матеріал' })
  @ApiCreatedResponse({ description: 'Створений матеріал' })
  create(@Body() dto: CreateMaterialDto): Promise<Material> {
    return this.materialsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Оновити матеріал (часткові правки)' })
  @ApiOkResponse({ description: 'Оновлений матеріал' })
  @ApiNotFoundResponse({ description: 'Матеріал не знайдено' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialDto,
  ): Promise<Material> {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Видалити матеріал' })
  @ApiNoContentResponse({ description: 'Матеріал видалено' })
  @ApiNotFoundResponse({ description: 'Матеріал не знайдено' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.materialsService.remove(id);
  }
}
