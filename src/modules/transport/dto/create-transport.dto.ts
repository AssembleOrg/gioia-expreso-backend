import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateTransportDto {
  @ApiProperty({
    description: 'Nombre del transporte',
    example: 'Camión Ford F-4000',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    description: 'Patente del vehículo',
    example: 'AB123CD',
  })
  @IsString({ message: 'La patente debe ser un texto' })
  @IsNotEmpty({ message: 'La patente es requerida' })
  @Matches(/^[A-Z]{2,3}[0-9]{3}[A-Z]{0,2}$/i, {
    message: 'La patente debe tener formato válido (ej: AB123CD o ABC123)',
  })
  licensePlate: string;

  @ApiPropertyOptional({
    description: 'Indica si el transporte está disponible',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo disponible debe ser verdadero o falso' })
  available?: boolean = true;
}


