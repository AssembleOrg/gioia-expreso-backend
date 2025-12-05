import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PackageTypeEnum {
  BULTO = 'BULTO',
  BAG_20X32 = 'BAG_20X32',
  BAG_30X41 = 'BAG_30X41',
  BAG_42X54 = 'BAG_42X54',
  BAG_70X80 = 'BAG_70X80',
}

export class PackageItemDto {
  @ApiProperty({
    description: 'Tipo de paquete',
    enum: PackageTypeEnum,
    example: PackageTypeEnum.BULTO,
  })
  @IsEnum(PackageTypeEnum)
  packageType: PackageTypeEnum;

  @ApiProperty({
    description: 'Cantidad de paquetes de este tipo',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Peso en kilogramos',
    example: 5.5,
    minimum: 0.1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  weight: number;

  @ApiPropertyOptional({
    description: 'Alto en cm (solo para BULTO)',
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({
    description: 'Ancho en cm (solo para BULTO)',
    example: 40,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({
    description: 'Profundidad en cm (solo para BULTO)',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  depth?: number;

  @ApiPropertyOptional({
    description: 'Valor declarado del paquete',
    example: 10000,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  declaredValue?: number;
}

