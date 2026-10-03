import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { LIMITE_MAXIMO } from '@common/pagination';

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
    @IsInt({ message: 'La página debe ser un número entero' })
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Elementos por página (solo paginación)',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt({ message: 'El límite debe ser un número entero' })
    @Min(1)
    @Max(LIMITE_MAXIMO, { message: `El límite máximo es ${LIMITE_MAXIMO}` })
    limit?: number = 10;


}