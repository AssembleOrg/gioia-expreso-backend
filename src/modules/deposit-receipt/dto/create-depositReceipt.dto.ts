import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, ValidateIf, IsDate, IsNumber } from 'class-validator';

export class CreateDepositReceiptDto {
    @ApiProperty({
        description: 'Nombre del cliente',
        example: 'Pedro'
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        description: 'Apellido del cliente',
        example: 'Perez'
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiPropertyOptional({
        description: 'DNI del cliente',
        example: '12345678'
    })
    @IsString()
    @IsOptional()
    @ValidateIf((o) => !o.cuit)
    @IsNotEmpty({ message: 'Debe proporcionar CUIT o DNI' })
    dni?: string;

    @ApiPropertyOptional({
        description: 'CUIT del cliente',
        example: '20123456789'
    })
    @IsString()
    @IsOptional()
    @ValidateIf((o) => !o.dni)
    @IsNotEmpty({ message: 'Debe proporcionar CUIT o DNI' })
    cuit?: string;

    @ApiProperty({
        description: 'Email del cliente',
        example: 'usuario@example.com'
    })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Descripcion del deposito',
        example: 'Sillas y mesas'
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        description: 'Tiempo estimado de deposito',
        example: '2022-01-01T00:00:00.000Z'
    })
    @IsDate()
    @IsNotEmpty()
    timeEstimated: Date;

    @ApiPropertyOptional({
        description: 'Valor aproximado del deposito',
        example: 1000
    })
    @IsNumber()
    @IsOptional()
    valueAprox?: number;

    @ApiProperty({
        description: 'Precio del deposito',
        example: 1000
    })
    @IsNumber()
    @IsNotEmpty()
    price: number;
}
