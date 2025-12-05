import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { AfipCredentialsDto } from './afip-credentials.dto';

export class CondicionesIvaDto extends AfipCredentialsDto {
  @ApiPropertyOptional({
    description: 'Clase de comprobante para filtrar (A, B, C, M)',
    example: 'C',
    enum: ['A', 'B', 'C', 'M'],
  })
  @IsOptional()
  @IsString({ message: 'La clase de comprobante debe ser un string' })
  @IsIn(['A', 'B', 'C', 'M'], { 
    message: 'La clase de comprobante debe ser A, B, C o M',
  })
  claseComprobante?: string;
}

