import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez García',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullname: string;

  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '+54 11 1234-5678',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'cliente@email.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'CUIT del cliente',
    example: '20-12345678-9',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}-\d{7,8}-\d$/, {
    message: 'CUIT debe tener formato XX-XXXXXXXX-X',
  })
  cuit?: string;

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Av. Corrientes 1234, CABA',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address: string;
}

