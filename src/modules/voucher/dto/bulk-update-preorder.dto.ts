import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, ArrayMinSize, IsUUID } from 'class-validator';
import { PreorderStatus } from './update-preorder.dto';

export class BulkUpdatePreorderDto {
  @ApiProperty({
    description: 'Lista de IDs de preorders a actualizar',
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    type: [String],
    minItems: 1,
  })
  @IsArray({ message: 'Los IDs deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un ID' })
  @IsUUID(4, { each: true, message: 'Cada ID debe ser un UUID válido' })
  ids: string[];

  @ApiProperty({
    description: 'Nuevo estado para todas las preorders',
    enum: PreorderStatus,
    example: PreorderStatus.PENDING,
  })
  @IsEnum(PreorderStatus, { message: 'El estado debe ser un valor válido del enum PreorderStatus' })
  status: PreorderStatus;
}

