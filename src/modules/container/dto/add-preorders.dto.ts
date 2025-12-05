import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AddPreordersDto {
  @ApiProperty({
    description: 'IDs de preórdenes a agregar al contenedor',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray({ message: 'Los IDs de preórdenes deben ser un array' })
  @ArrayNotEmpty({ message: 'Debe proporcionar al menos una preorden' })
  @IsUUID('4', { each: true, message: 'Cada ID de preorden debe ser un UUID válido' })
  preorderIds: string[];
}

