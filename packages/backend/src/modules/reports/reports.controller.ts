import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { Paginated, Report } from '@pcf/shared';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Список згенерованих звітів' })
  @ApiOkResponse()
  list(@Query() query: ListReportsQueryDto): Promise<Paginated<Report>> {
    return this.reportsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Метадані звіту' })
  @ApiOkResponse()
  @ApiNotFoundResponse()
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Report> {
    return this.reportsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Згенерувати звіт PDF / CSV / JSON CX-0029',
    description:
      'Idempotent: якщо звіт того самого (calculationId, format, locale) уже існує — ' +
      'файл перезаписується, запис у БД оновлюється.',
  })
  @ApiCreatedResponse({ description: 'Метадані згенерованого звіту' })
  generate(@Body() dto: GenerateReportDto): Promise<Report> {
    return this.reportsService.generate(dto);
  }

  @Get(':id/file')
  @ApiOperation({
    summary: 'Скачати файл звіту (Content-Disposition: attachment)',
  })
  @ApiProduces('application/pdf', 'text/csv', 'application/json')
  @ApiNotFoundResponse({ description: 'Звіт або файл не знайдено' })
  @Header('Cache-Control', 'no-store')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { stream, contentType, sizeBytes, suggestedFilename } =
      await this.reportsService.openFile(id);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', sizeBytes.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(suggestedFilename)}"`,
    );
    stream.pipe(res);
    stream.on('error', (err) => {
      res.destroy(err);
    });
  }
}
