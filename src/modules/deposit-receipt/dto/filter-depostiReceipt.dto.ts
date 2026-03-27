import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterDepositReceiptDto {
    @ApiPropertyOptional({
        description: 'DNI del cliente a buscar',
        example: '123456789'
    })
    @IsOptional()
    @IsString()
    dni?: string;

    @ApiPropertyOptional({
        description: 'CUIT del cliente a buscar',
        example: '123456789'
    })
    @IsOptional()
    @IsString()
    cuit?: string;

    //To search in a range of dates
    @ApiPropertyOptional({
        description: 'Fecha de inicio filtrado',
        example: '2022-01-01T00:00:00.000Z'
    })
    @IsOptional()
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional({
        description: 'Fecha de fin filtrado',
        example: '2022-01-01T00:00:00.000Z'
    })
    @IsOptional()
    @IsDate()
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'Número de página (solo paginación)',
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Elementos por página (solo paginación)',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    limit?: number = 10;


}