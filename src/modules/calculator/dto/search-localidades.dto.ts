import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchLocalidadesDto {
  @ApiProperty({
    description: 'Término de búsqueda para localidades',
    example: 'la pl',
    required: true,
  })
  @IsString()
  q: string;

  @ApiProperty({
    description: 'Indica si la localidad está atendida (1) o no (0)',
    example: 1,
    default: 1,
    required: false,
    enum: [0, 1],
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  atendida?: number = 1;
}

