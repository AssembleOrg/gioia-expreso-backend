import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidBultoPeso } from '@common/validators';

export class BultoDto {
  @ApiProperty({
    description: 'Cantidad de bultos',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiProperty({
    description: 'Peso en kilogramos. Puede ser 0 si las dimensiones (x, y, z) son 0 (paquete predefinido). Debe ser > 0 si se especifican dimensiones (bulto personalizado).',
    example: 20,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  peso: number;

  @ApiProperty({
    description: 'Dimensión X (largo) en centímetros',
    example: 50,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  x: number;

  @ApiProperty({
    description: 'Dimensión Y (ancho) en centímetros',
    example: 50,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  y: number;

  @ApiProperty({
    description: 'Dimensión Z (alto) en centímetros',
    example: 50,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  z: number;

  @ApiProperty({
    description: 'Valor declarado del bulto',
    example: 20000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valor_declarado: number;
}

