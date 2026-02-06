import { ApiProperty } from '@nestjs/swagger';

export class AdicionalRetiroDto {
  @ApiProperty({ example: 'ADICIONAL RETIRO' })
  articulos_retiro: string;

  @ApiProperty({ example: 190 })
  articulos_id: number;

  @ApiProperty({ example: 0 })
  desde: number;

  @ApiProperty({ example: 2573.05 })
  retiro: number;

  @ApiProperty({ example: 8 })
  um_id: number;

  @ApiProperty({ example: 'Peso volumetrico' })
  um: string;

  @ApiProperty({ example: 138341 })
  adicionales_localidades_id: number;
}

export class AdicionalEntregaDto {
  @ApiProperty({ example: 'ADICIONAL ENTREGA' })
  articulos_entrega: string;

  @ApiProperty({ example: 191 })
  articulos_id: number;

  @ApiProperty({ example: 0 })
  desde: number;

  @ApiProperty({ example: 2573.05 })
  entrega: number;

  @ApiProperty({ example: 8 })
  um_id: number;

  @ApiProperty({ example: 'Peso volumetrico' })
  um: string;

  @ApiProperty({ example: 138341 })
  adicionales_localidades_id: number;
}

export class CredifinCotizacionItemDto {
  @ApiProperty({ example: 0 })
  PrecioReal: number;

  @ApiProperty({ example: 16741.68 })
  precio: number;

  @ApiProperty({ example: 'SEGURO' })
  articulos_seguro: string;

  @ApiProperty({ example: 192 })
  articulos_seguro_id: number;

  @ApiProperty({ example: 0 })
  AlicuotaSeguro: number;

  @ApiProperty({ example: 1500000 })
  seguro_maximo: number;

  @ApiProperty({ example: 280000 })
  seguro_minimo: number;

  @ApiProperty({ example: 750000 })
  seguro_sin_documentacion: number;

  @ApiProperty({ example: null, nullable: true })
  volumen: number | null;

  @ApiProperty({ example: 0 })
  peso_volumetrico: number;

  @ApiProperty({ example: null, nullable: true })
  factor: number | null;

  @ApiProperty({ example: 1389 })
  distancia_km: number;

  @ApiProperty({ type: [AdicionalRetiroDto], required: false })
  adicional_retiro?: AdicionalRetiroDto[];

  @ApiProperty({ type: [AdicionalEntregaDto], required: false })
  adicional_entrega?: AdicionalEntregaDto[];
}

export class CredifinCotizacionResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ type: [CredifinCotizacionItemDto] })
  data: CredifinCotizacionItemDto[];
}
