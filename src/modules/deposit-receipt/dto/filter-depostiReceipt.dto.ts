import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate } from 'class-validator';

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


}