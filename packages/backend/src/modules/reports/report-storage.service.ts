import { createHash } from 'node:crypto';
import { createReadStream, type ReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface StoredFile {
  /** Шлях відносно `reportsDir` (наприклад `<calcId>/PDF_ISO_14067.pdf`). */
  filePath: string;
  sizeBytes: number;
  contentHash: string;
}

/**
 * Файлове сховище згенерованих звітів.
 *
 * Структура: `<reportsDir>/<calculationId>/<format>.<ext>`. Один файл на (calc, format)
 * — при повторній генерації перезаписуємо.
 *
 * Захист path traversal: `resolvePath` гарантує, що результат лежить **усередині**
 * `reportsDir` — навіть якщо хтось у БД перепише `file_path` на `../etc/passwd`,
 * запит файлу впаде з 400.
 */
@Injectable()
export class ReportStorageService {
  private readonly logger = new Logger(ReportStorageService.name);
  private readonly reportsDirAbs: string;

  constructor(config: ConfigService) {
    const dir = config.getOrThrow<string>('reportsDir');
    this.reportsDirAbs = path.resolve(process.cwd(), dir);
  }

  async write(
    calculationId: string,
    fileName: string,
    buffer: Buffer,
  ): Promise<StoredFile> {
    const safeCalcId = this.assertSafeSegment(calculationId);
    const safeName = this.assertSafeSegment(fileName);
    const dir = path.join(this.reportsDirAbs, safeCalcId);
    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, safeName);
    await fs.writeFile(fullPath, buffer);

    const hash = createHash('sha256').update(buffer).digest('hex');
    const filePath = path.posix.join(safeCalcId, safeName);
    this.logger.log(
      `Записано звіт ${filePath} (${buffer.length} bytes, sha256=${hash.slice(0, 12)}…)`,
    );
    return { filePath, sizeBytes: buffer.length, contentHash: hash };
  }

  /**
   * Розв'язати relative path у абсолютний з валідацією, що результат
   * не виходить за межі `reportsDir` (anti path-traversal).
   */
  resolvePath(relativePath: string): string {
    const full = path.resolve(this.reportsDirAbs, relativePath);
    const normalizedRoot = this.reportsDirAbs.endsWith(path.sep)
      ? this.reportsDirAbs
      : this.reportsDirAbs + path.sep;
    if (full !== this.reportsDirAbs && !full.startsWith(normalizedRoot)) {
      throw new BadRequestException(
        `Звіт лежить поза дозволеною директорією: ${relativePath}`,
      );
    }
    return full;
  }

  async openReadStream(relativePath: string): Promise<ReadStream> {
    const full = this.resolvePath(relativePath);
    try {
      await fs.access(full);
    } catch {
      throw new NotFoundException(`Файл звіту не знайдено: ${relativePath}`);
    }
    return createReadStream(full);
  }

  async deleteFile(relativePath: string): Promise<void> {
    const full = this.resolvePath(relativePath);
    await fs.unlink(full).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Не вдалось видалити ${relativePath}: ${msg}`);
    });
  }

  /** Не пропускати "..", "/", "\\" у segments — захист path traversal. */
  private assertSafeSegment(segment: string): string {
    if (
      !segment ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('/') ||
      segment.includes('\\') ||
      segment.includes('\0')
    ) {
      throw new BadRequestException(`Невалідний сегмент шляху: "${segment}"`);
    }
    return segment;
  }
}
