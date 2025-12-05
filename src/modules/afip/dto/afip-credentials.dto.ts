import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AfipCredentialsDto {
  @ApiProperty({
    description: 'CUIT del emisor',
    example: '20123456789',
  })
  @IsString({ message: 'El CUIT del emisor debe ser un string' })
  @IsNotEmpty({ message: 'El CUIT del emisor es requerido' })
  cuitEmisor: string;

  @ApiProperty({
    description: 'Certificado digital en formato PEM',
    example: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
  })
  @IsString({ message: 'El certificado debe ser un string' })
  @IsNotEmpty({ message: 'El certificado es requerido' })
  certificado: string;

  @ApiProperty({
    description: 'Clave privada en formato PEM',
    example: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----',
  })
  @IsString({ message: 'La clave privada debe ser un string' })
  @IsNotEmpty({ message: 'La clave privada es requerida' })
  clavePrivada: string;
}

