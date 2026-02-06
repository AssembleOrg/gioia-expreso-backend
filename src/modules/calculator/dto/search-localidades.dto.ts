import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchLocalidadesDto {
  @ApiProperty({
    description: 'Término de búsqueda para localidades',
    example: 'santa fe',
    required: true,
  })
  @IsString()
  q: string;

  @ApiProperty({
    description: 'Nivel de cobertura de la localidad',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cobertura?: number = 1;
}

