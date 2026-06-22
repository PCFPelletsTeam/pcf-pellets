import { PartialType } from '@nestjs/swagger';
import { CreateMaterialDto } from './create-material.dto';

/**
 * PATCH-update — усі поля опціональні, але якщо передані — валідуються
 * за тими ж правилами, що в CreateMaterialDto.
 */
export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
