import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CotizacionItemDto } from './cotizacion-item.dto';

export class CotizarDto {
  @ApiProperty({
    description: 'Array de items de cotización',
    type: [CotizacionItemDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CotizacionItemDto)
  cotizacion: CotizacionItemDto[];
}

